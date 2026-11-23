import { useState, useEffect, Fragment, useRef, useContext } from "react";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ZineData, getZine, getArticle, getModification, addComment, removeComment } from "../../lib/firebase";
import Markdown from 'react-markdown'
import { AuthContext } from "../../store/AuthContext";
import CommentPopup, { NewComment } from "./commentPopup";
import { useCommentHighlights, focusComment, offsetFromPoint } from "./commentHighlight";
import { useMarkdownEditor } from "./markdownEditor";
import remarkGfm from "remark-gfm";
import { saveEdit } from "../Utility/saveEdit";
import { EditorContent } from "@tiptap/react";

interface Props {
    room: number;
    section: number;
    changeSection: Function;
    isModifying: boolean;
    setIsModifying: React.Dispatch<React.SetStateAction<boolean>>;
    toolsOpen: boolean;
    setToolsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface ArticleText {
    title: string;
    version: number;
    text: string;
    bibliography: [any];
    author: string;
}

export default function Zine({ room, section, changeSection, isModifying, setIsModifying, toolsOpen, setToolsOpen }: Props) {
    const articleRef = useRef<HTMLDivElement>(null);
    const { user, profile } = useContext(AuthContext);

    //general states
    const mapImages: Record<number, string> = { 1: "/rooms/maps/1/map1_General.png", 2: "/rooms/maps/2/map2_General.png" };
    const mapTexts: Record<number, string> = { 1: "/rooms/maps/1/map1_Text.png", 2: "/rooms/maps/2/map2_Text.png" };
    const map = mapImages[room];
    const mapText = mapTexts[room];

    //article states
    const [articleOpen, setArticleOpen] = useState<number>(1)
    const [versionOpen, setVersionOpen] = useState<number>(0)
    const [modification, setModification] = useState<number>(0)
    const [articleText, setArticleText] = useState<ArticleText>()
    const [loading, setLoading] = useState<boolean>(false);

    const loadingOpacity = loading ? "100" : "0"

    //article memory states
    const [zineData, setZineData] = useState<any[]>();
    const [articlesData, setArticlesData] = useState<any[]>();
    const [versionsData, setVersionsData] = useState<any[]>();
    const [modificationsData, setModificationsData] = useState<any[]>();
    const modificationLetter = (index: number): string =>
        (index >= 26 ? modificationLetter(Math.floor(index / 26) - 1) : "") + String.fromCharCode(97 + (index % 26));
    const articleLabel = (zine: number, article: number, versionIndex: number, modIndex?: number) =>
        `${zine}.${article}.${versionIndex + 1}` + (modIndex === undefined ? "" : `.${modificationLetter(modIndex)}`);

    //utility states
    type SidePanel = "versions" | "comments" | null;
    const [sidePanel, setSidePanel] = useState<SidePanel>(null);
    const [activeComment, setActiveComment] = useState<number | null>(null);

    const frameHeight = toolsOpen ? 75 : 90;
    const frameWidth = sidePanel ? 40 : isModifying ? 54 : 60;
    const frameStart = isModifying ? "25%" : "20%"

    //Modify
    const { editor, actions, getMarkdown } = useMarkdownEditor(articleText?.text ?? "", isModifying);
    const [saving, setSaving] = useState<boolean>(false)

    const accent = room === 1
        ? { text: "text-red-500", scrollbar: "scrollbar-thumb-red-500" }
        : { text: "text-green-500", scrollbar: "scrollbar-thumb-green-500" };

    useEffect(() => {
        const getZineData = async () => {
            await ZineData()
                .then((response) => {
                    setZineData(response);
                });
        }
        getZineData()
    }, [])

    const toggleTools = () => setToolsOpen(open => !open);

    const togglePanel = (panel: "versions" | "comments") => {
        setIsModifying(false);
        setToolsOpen(false);
        setSidePanel(current => (current === panel ? null : panel));
    };

    const toggleModify = () => {
        setToolsOpen(false)
        setSidePanel(null);
        setIsModifying(isModifying => !isModifying);
    }

    const handleAddComment = async (comment: NewComment) => {
        const full = { ...comment, author: user!.uid, authorName: profile?.displayName ?? "", created: Date.now() };
        await addComment({
            zine: zineData![room - 1].id,
            article: articlesData![articleOpen - 1].id,
            version: versionsData![versionOpen].id,
            modification: modificationsData![modification].id,
        }, full);
        setModificationsData((prev: any) => prev.map((m: any, i: number) => i === modification ? { ...m, comments: [...(m.comments ?? []), full] } : m));
    };

    const handleRemoveComment = async (comment: any) => {
        await removeComment({
            zine: zineData![room - 1].id,
            article: articlesData![articleOpen - 1].id,
            version: versionsData![versionOpen].id,
            modification: modificationsData![modification].id,
        }, comment);
        setModificationsData((prev: any) => prev.map((m: any, i: number) => i === modification ? { ...m, comments: (m.comments ?? []).filter((c: any) => c !== comment) } : m));
        setActiveComment(null);
    };

    const handleCommentClick = (comment: any, index: number) => {
        setActiveComment(index);
        if (articleRef.current) focusComment(articleRef.current, comment);
    };

    const handleArticleClick = (e: React.MouseEvent) => {
        const container = articleRef.current;
        if (sidePanel !== "comments" || !container || !window.getSelection()?.isCollapsed) return;
        const offset = offsetFromPoint(container, e.clientX, e.clientY);
        const comments = modificationsData?.[modification]?.comments ?? [];
        const index = offset === null ? -1 : comments.findIndex((c: any) =>
            typeof c.comment_reference === "object" && offset >= c.comment_reference.start && offset <= c.comment_reference.end);
        setActiveComment(index === -1 ? null : index);
        if (index === -1) CSS.highlights?.delete("comment-active");
        else focusComment(container, comments[index], false);
    };

    const handleSave = async () => {
        if (!user || saving) return;
        setSaving(true);
        try {
            const version = versionsData![versionOpen];
            const ids = { zine: zineData![room - 1].id, article: articlesData![articleOpen - 1].id, version: version.id };
            const result = await saveEdit(ids, version, getMarkdown(), user.uid, profile?.displayName ?? "", articleText?.bibliography);
            setIsModifying(false);
            await setArticleContent(articleOpen - 1, 0, 0, result);
        } catch (error) {
            console.error("Couldn't save the article:", error);
        } finally {
            setSaving(false);
        }
    };

    useCommentHighlights(
        articleRef,
        sidePanel === "comments" ? modificationsData?.[modification]?.comments : undefined,
        articleText?.text
    );

    async function setArticleContent(article: number, versionNumber: number, modificationNumber: number, target?: { versionId: string; modificationId: string }) {
        if (zineData === undefined) return
        changeSection(1)
        setLoading(true);
        var zineArticles: any, specificArticle: any, specificModification: any;
        //get info about specific article, version and modification
        zineArticles = await getZine(zineData[room - 1])
        specificArticle = await getArticle(zineData[room - 1], zineArticles[article])
        if (target) versionNumber = Math.max(0, specificArticle.findIndex((v: any) => v.id === target.versionId));
        specificModification = await getModification(zineData[room - 1], zineArticles[article], specificArticle[versionNumber])
        if (target) modificationNumber = Math.max(0, specificModification.findIndex((m: any) => m.id === target.modificationId));
        if (!specificModification[modificationNumber]) modificationNumber = 0;
        if (!specificModification[0]) { console.error("This version has no modifications."); setLoading(false); return; }
        //get title card
        const storage = getStorage();
        const pathReference = ref(storage, 'zinetitles/' + room.toString() + '/' + room.toString() + '.' + (article + 1) + '.png');
        let titleUrl = "";
        try {
            titleUrl = await getDownloadURL(pathReference);
        } catch (error) {
            console.error("Couldn't load title card:", error);
        } finally {
            setLoading(false);
        }
        setArticleText({
            title: titleUrl,
            version: versionNumber,
            text: specificModification[modificationNumber].text,
            bibliography: specificModification[modificationNumber].bibliography,
            author: specificArticle[versionNumber].author
        })
        setArticleOpen(article + 1);
        setArticlesData(zineArticles);
        setVersionOpen(versionNumber);
        setVersionsData(specificArticle);
        setModification(modificationNumber);
        setModificationsData(specificModification);
    }

    if (section === 0) {
        return (
            <div id="map">
                {room === 1 && (
                    <>
                        <img className="absolute w-[50%] h-[50%] left-[23%] top-[25%] pointer-events-none" src={map} />
                        <div id="bathroom" className="floor floor1 absolute w-[13%] h-[32%] left-[60%] top-[24%]" onClick={() => setArticleContent(1, 0, 0)}></div>
                        <div id="office" className="floor floor1 absolute w-[23%] h-[20%] left-[40%] top-[55%]" onClick={() => setArticleContent(2, 0, 0)}></div>
                        <div id="bookshelf" className="floor floor1 absolute w-[10%] h-[20%] left-[63%] top-[55%]"></div>
                        <div id="livingRoom" className="floor floor1" onClick={() => setArticleContent(0, 0, 0)}>
                            <div className="absolute w-[30%] h-[30%] left-[30%] top-[25%]"></div>
                            <div className="absolute w-[10%] h-[20%] left-[30%] top-[55%]"></div>
                        </div>
                        <img className="absolute w-[50%] h-[50%] left-[23%] top-[25%] pointer-events-none" src={mapText} />
                    </>
                )
                }
                {
                    room === 2 && (
                        <>
                            <img className="absolute w-[58%] h-[80%] left-[20%] top-[10%] pointer-events-none" src={map} />
                            <div id="cloakroom" className="floor floor2 absolute w-[9%] h-[38%] left-[31%] top-[10%]" onClick={() => setArticleContent(0, 0, 0)}></div>
                            <div id="equipmentRoom" className="floor floor2 absolute w-[15%] h-[22%] left-[40.5%] top-[9%]" onClick={() => setArticleContent(1, 0, 0)}></div>
                            <div id="stage" className="floor floor2" onClick={() => setArticleContent(2, 0, 0)}>
                                <div className="absolute w-[30%] h-[38%] left-[40%] top-[30%]"></div>
                                <div className="absolute w-[15%] h-[20%] left-[55%] top-[10%]"></div>
                            </div>
                            <div id="bathrooms" className="floor floor2" onClick={() => setArticleContent(3, 0, 0)}>
                                <div className="absolute w-[8%] h-[15%] left-[45%] top-[65%]"></div>
                                <div className="absolute w-[25%] h-[12%] left-[45%] top-[78%]"></div>
                            </div>
                            <div id="smokingArea" className="floor floor2 absolute w-[10%] h-[80%] left-[68%] top-[9%]" onClick={() => setArticleContent(4, 0, 0)}></div>
                            <img className="absolute w-[58%] h-[80%] left-[20%] top-[10%] pointer-events-none" src={mapText} />
                        </>
                    )
                }

            </div >
        )
    } else {
        return (
            <>
                <div id='zine' className={"absolute transition-all duration-300 top-[2%]"} style={{ height: `${frameHeight}%`, width: `${frameWidth}%`, left: `${frameStart}` }} >
                    <img id="loading" className={"absolute w-[50%] h-[10%] left-[25%] top-[40%] pointer-events-none transition-opacity duration-500 z-800"} style={{ opacity: `${loadingOpacity}%` }} src="./rooms/zine/buttons/Loading.png" />
                    <img id='articleText' className="absolute top-[0] left-[0] w-full h-[100%]" src="./rooms/zine/generalFrame.png" />
                    <div id='text' className={"absolute top-[3%] left-[0] w-[98%] h-[90%] overflow-y-scroll overflow-x-hidden " + accent.scrollbar}>
                        <img id='title' className="w-full h-auto top-[5%]" src={articleText?.title} />
                        <p id="author" className="text-center font-serif">{articleText?.author}</p>
                        <p id='articleName' className={"font-serif text-center mb-[2%] " + accent.text}>{articleLabel(room, articleOpen, versionOpen, modification)}</p>
                        <p id='articleCreated' className={"font-serif text-center mb-[3%]"}>{modificationsData?.[modification]?.created?.toDate().toLocaleString("en-US", { month: "short", year: "numeric", })}</p>
                        <div ref={articleRef} className="article mx-[5%]" onClick={handleArticleClick}>
                            {isModifying
                                ? <EditorContent editor={editor} className="font-serif" />
                                : <Markdown remarkPlugins={[remarkGfm]}>{articleText?.text}</Markdown>}
                        </div>
                        {articleText?.bibliography?.map((reference, index) => {
                            return <p key={index} className={"font-serif italic mr-[5%] ml-[10%] my-[2%] " + accent.text}>{index + 1}: {reference}</p>
                        })}
                    </div>
                </div >
                <CommentPopup containerRef={articleRef} enabled={!!user && !isModifying} onSubmit={handleAddComment} />
                <div id='zineButtons' className="absolute h-[20%] w-[60%] left-[20%] bottom-[0] transition duration-300" style={{ transform: toolsOpen ? "none" : "translateY(66.67%)" }} onClick={toggleTools}>
                    <img id='buttonsOutline' className="absolute top-[0] left-[0] w-full h-full" src="./rooms/zine/buttons/outline.png" />
                    <div className="flex absolute w-[90%] h-[70%] left-[5%] bottom-[2%]">
                        <div className='zineButtonCell'>
                            <img id='versions' className="authbutton w-full h-full" src="./rooms/zine/buttons/versions.png" onClick={(e) => { e.stopPropagation(); togglePanel("versions"); }} />
                        </div>
                        <div className='zineButtonCell'>
                            <img id='comments' className="authbutton w-full h-full" src="./rooms/zine/buttons/comments.png" onClick={(e) => { e.stopPropagation(); togglePanel("comments"); }} />
                        </div>
                        <div className='zineButtonCell'>
                            <img id='modify' className="authbutton w-full h-full" src="./rooms/zine/buttons/modify.png" onClick={(e) => { e.stopPropagation(); toggleModify() }} />
                        </div>
                    </div>
                </div>
                {sidePanel && (
                    <div id="side-frame" className="absolute right-[22%] top-[2%] transition-all duration-300"
                        style={{ height: `${frameHeight}%`, width: "17%" }}>
                        <img id="sideframeImage" className="absolute top-0 left-0 w-full h-full" src="./rooms/zine/side-frame.png" />
                        <SideBarContent
                            type={sidePanel}
                            versions={versionsData}
                            modificationData={modificationsData}
                            modification={modification} room={room}
                            articleOpen={articleOpen}
                            setArticleContent={setArticleContent}
                            onCommentClick={handleCommentClick}
                            activeComment={activeComment}
                            handleRemoveComment={handleRemoveComment}
                            versionOpen={versionOpen} />
                    </div>
                )}
                {isModifying && (
                    <>
                        <div id="modifyBar" className="absolute left-[20%] top-[2%] transition-all duration-300" style={{ height: "60%", width: "5%" }}>
                            <img id="modifyBarImages" className="absolute top-0 left-0 w-full h-full" src="./rooms/zine/modify/modifyBar.png" />
                            <div id='util' className="flex flex-col justify-evenly items-center absolute h-[94%] w-[90%] top-[2%] left-[10%]">
                                <img src="./rooms/zine/modify/normal.png" className="modifyButton" onMouseDown={(e) => e.preventDefault()} onClick={actions.clear} />
                                <img src="./rooms/zine/modify/italic.png" className="modifyButton" onMouseDown={(e) => e.preventDefault()} onClick={actions.italic} />
                                <img src="./rooms/zine/modify/bold.png" className="modifyButton" onMouseDown={(e) => e.preventDefault()} onClick={actions.bold} />
                                <img src="./rooms/zine/modify/underline.png" className="modifyButton" onMouseDown={(e) => e.preventDefault()} onClick={actions.strikethrough} />
                                <img src="./rooms/zine/modify/link.png" className="modifyButton" onMouseDown={(e) => e.preventDefault()} onClick={actions.link} />
                                <div id='fontSizeModify' className="h-[7%] w-[70%] ml-[5%] mr-[5%] flex justify-between">
                                    <img src="./rooms/zine/modify/+.png" className="w-[40%] h-full hover:bg-red-500 p-[5%]" onMouseDown={(e) => e.preventDefault()} onClick={actions.biggerHeading} />
                                    <div className="w-[40%] h-[full] hover:bg-red-500 p-[5%] flex items-center" onMouseDown={(e) => e.preventDefault()} onClick={actions.smallerHeading}>
                                        <img src="./rooms/zine/modify/-.png" className="w-full h-[8%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='zineButtonCell absolute left-[18%] top-[60%] w-[4.5%] h-[14%]' onClick={handleSave}>
                            <img id='save' className="authbutton w-full h-full" src="./rooms/zine/buttons/save.png" />
                        </div>
                    </>
                )}
            </>
        )
    }
}

function SideBarContent({ type, versions, modificationData, modification, room, articleOpen, setArticleContent, onCommentClick, activeComment, handleRemoveComment, versionOpen }: any) {
    const commentRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { user } = useContext(AuthContext);

    const modificationLetter = (index: number): string =>
        (index >= 26 ? modificationLetter(Math.floor(index / 26) - 1) : "") + String.fromCharCode(97 + (index % 26));
    const articleLabel = (zine: number, article: number, versionIndex: number) => `${zine}.${article}.${versionIndex + 1}`;

    const [closeSrc, setCloseSrc] = useState<string>("rooms/overlay/login/modal/buttons/close_inactive.png")

    useEffect(() => {
        if (activeComment !== null) commentRefs.current[activeComment]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [activeComment]);

    return (
        <div className="absolute top-[5%] left-[5%] w-[90%] h-[90%] overflow-y-scroll vulf">
            {type === "versions" ? <img className="w-[90%] h-[10%] mx-[5%] mb-[5%]" src={`./rooms/zine/commentBubbles/versions.png`} />
                : <img className="w-[90%] h-[10%] mx-[5%] mb-[5%]" src={`./rooms/zine/commentBubbles/comments.png`} />}
            {type === "versions" && versions.map((version: any, versionIndex: number) => (
                <Fragment key={versionIndex}>
                    <div className="authbutton relative mb-[5%] mx-[5%]" onClick={() => { setArticleContent(articleOpen - 1, versionIndex, 0) }}>
                        <img className="absolute inset-0 w-full h-full" src={`./rooms/zine/commentBubbles/comment${Math.floor(Math.random() * 3).toString()}.png`} />
                        <p className="relative p-[8%] underline">{articleLabel(room, articleOpen, versionIndex)}</p>
                    </div>
                    {versionIndex === versionOpen && modificationData.map((mod: any, modIndex: number) => (
                        <div key={modIndex} className="authbutton relative mb-[5%] mx-[5%] ml-[30%]" onClick={() => { setArticleContent(articleOpen - 1, versionIndex, modIndex) }}>
                            <img className="absolute inset-0 w-full h-full" src={`./rooms/zine/commentBubbles/comment${Math.floor(Math.random() * 3).toString()}.png`} />
                            <p className="relative p-[8%] underline">{modificationLetter(modIndex)}</p>
                        </div>
                    ))}
                </Fragment>
            ))}
            {type === "comments" && modificationData[modification].comments?.map((value: any, key: number) => (
                <div key={key} className="commentButton relative mt-[10%] mx-[5%]" style={{ opacity: key === activeComment ? 1 : 0.8 }} onClick={() => onCommentClick(value, key)}>
                    <img className="absolute inset-0 w-full h-full" src={"./rooms/zine/commentBubbles/comment" + Math.floor(Math.random() * 3).toString() + ".png"} />
                    <p className="relative p-[8%]">{value.comment_text}</p>
                    {value.comment_reference.username && <p className="pl-[8%] pb-[5%] relative font-serif">{value.authorName}</p>}
                    {user?.uid === value.author && < img id="closeComment" className="absolute w-[10%] h-[30px] right-[0] top-[-15%]" src={closeSrc}
                        onClick={(e) => { e.stopPropagation(); handleRemoveComment(value) }}
                        onMouseLeave={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_inactive.png")}
                        onMouseDown={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_active.png")} />}
                </div>
            ))}
        </div>
    )
}