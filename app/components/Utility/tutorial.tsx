import { useState } from "react";

interface Props {
    room: number;
    section: number;
    zineOn: boolean;
    tutorialOn: boolean;
    setTutorialOn: Function;
    isModifying: boolean;
    setToolsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isMobile: boolean;
    menuOpen: any[];
    setMenuOpen: Function;
}


export default function Tutorial({ room, section, zineOn, tutorialOn, setTutorialOn, isModifying, setToolsOpen, isMobile, menuOpen, setMenuOpen }: Props) {
    const [helpSrc, setHelpSrc] = useState<string>('/rooms/overlay/buttons/help_inactive.png');

    const tutorialSrc = zineOn ? section === 0 ? "./rooms/tutorials/mapTutorial.png" : isModifying ? "./rooms/tutorials/modifyTutorial.png" : "./rooms/tutorials/zineTutorial.png" : room === 3 ? "./rooms/tutorials/shopTutorial.png" : "./rooms/tutorials/floorTutorial.png";
    const tutorialMobileSrc = "./rooms/tutorials/shopTutorial_mobile.png";

    const turnOnTutorial = () => {
        if (room === 4) return
        if (tutorialOn) {
            setTutorialOn(false)
            setToolsOpen(false)
        } else {
            setTutorialOn(true)
            if (zineOn && section === 1 && !isModifying) setToolsOpen(true)
            setMenuOpen(["Closed", "Closed"]);
        }
    }

    return (
        <>
            {tutorialOn && (
                <div className="absolute w-full h-full z-6">
                    <img src={isMobile ? tutorialMobileSrc : tutorialSrc} className="absolute w-full h-full z-7" />
                    <div id='blackOut' className="w-full h-full bg-black opacity-50 z-6"></div>
                    {isMobile && <img className="absolute w-[50%] h-[10%] left-[25%] top-[2%] z-10" onClick={turnOnTutorial} src="./rooms/tutorials/CLOSE.png" />}
                </div>)
            }
            <div id='help' className={"absolute z-7 " + (isMobile ? ("overlayLiftDoorsTwo right-[2.5%] top-[40%] w-[20%] h-[20%] login" + menuOpen[0]) : "left-[2.5%] top-[3%] w-[6%] h-[15%]")}>
                <img id="helpOutline" className="w-full h-full" src="/rooms/overlay/overlay_help.png"></img>
                <img id="helpButton" className="absolute left-[10%] top-[10%] w-[80%] h-[80%]" src={helpSrc}
                    onMouseUp={() => setHelpSrc("/rooms/overlay/buttons/help_inactive.png")}
                    onMouseDown={() => setHelpSrc("/rooms/overlay/buttons/help_active.png")}
                    onClick={turnOnTutorial}></img>
            </div>
        </>
    )
}