import { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../store/AuthContext";
import Shop from "./Shop/shop";

interface Props {
    room: number;
    zineOn: Function;
    setShopOn: Function;
    shopOn: boolean;
    shopSection: number;
    setShopSection: Function;
    isMobile: boolean;
}

export default function Floor({ room, zineOn, setShopOn, shopOn, shopSection, setShopSection, isMobile }: Props) {
    const { user, profile } = useContext(AuthContext);
    const isLocked =
        !user ||
        (room === 1 && !profile?.zine1) ||
        (room === 2 && !profile?.zine2);
    const floorLiftstate = !isLocked ? 'floorLiftOpen' : 'floorLiftClosed'

    const floorImages: Record<number, string> = { 1: "/rooms/floors/Floor1.png", 2: "/rooms/floors/Floor2.png", 3: "/rooms/floors/Shop.png", 4: "/rooms/floors/about.png" };
    const floorImage = floorImages[room];

    if (room > 0 && room < 3) {
        return (
            <div id='activeRoom' className="absolute w-full h-full left-[0] top-[0] image-pixelated">
                <img className="absolute z-2 w-full h-full pointer-events-none" src={floorImage} alt={`Image of the active room: ${room}`}></img>
                <div id={floorLiftstate} className="floorLift absolute z-1 left-[40%] top-[12%] w-[20%] h-[45%]">
                    <img id="zineOpen" className="absolute left-[23%] top-[40%] w-[55%] h-[25%]" src="/rooms/floors/OpenZine.png" onClick={() => !isLocked && zineOn()} />
                    <img id="liftDoorLeft2" className="liftdoorfloor absolute h-[100%] w-[52%] left-[0] top-[0]" src="rooms/floors/floorDoor/FloorDoorLeft_2.png"></img>
                    <img id="liftDoorRight2" className="liftdoorfloor absolute h-[100%] w-[52%] right-[0] top-[0]" src="rooms/floors/floorDoor/FloorDoorRight_2.png"></img>
                    <img id="liftDoorLeft1" className="liftdoorfloor absolute h-[100%] w-[35%] left-[0] top-[0]" src="rooms/floors/floorDoor/FloorDoorLeft_1.png"></img>
                    <img id="liftDoorRight1" className="liftdoorfloor absolute h-[100%] w-[35%] right-[0] top-[0]" src="rooms/floors/floorDoor/FloorDoorRight_1.png"></img>
                    {isLocked && <img id="lockedDoor" className="absolute w-[50%] h-[50%] left-[25%] top-[25%]" src="./rooms/overlay/login/logged_out.png" />}
                </div>
            </div >
        )
    } else if (room === 3) {
        return (
            <div id='activeRoom' className="absolute w-full h-full left-[0] top-[0] z-2 image-pixelated bg-black overflow-hidden">
                <img className="w-full h-full" src={floorImage} alt={`Image of the active room: ${room}`}></img>
                <Shop shopSection={shopSection} setShopSection={setShopSection} setShopOn={setShopOn} shopOn={shopOn} isMobile={isMobile} />
            </div>
        )
    } else if (room === 4) {
        return (
            <div id='activeRoom' className="absolute w-full h-full left-[0] top-[0] z-2 image-pixelated bg-white">
                <img className="w-full h-full" src={floorImage} alt={`Image of the active room: ${room}`}></img>
                <img className={"absolute rotate-[3deg] " + (isMobile ? "top-[1%] left-[5%] w-[90%] h-[13%]" : "top-[3%] left-[25%] w-[50%] h-[15%]")} src="./rooms/about/logo.png" alt={`The Echo Times logo`} />
                <div className={"absolute " + (isMobile ? "top-[40%] left-[20%] h-[35%] w-[80%]" : "top-[48%] left-[20%] h-[35%] w-[50%]")}>
                    <img className="w-full h-full" src="./rooms/about/postit_yellow.png" />
                    <img className="absolute top-[23%] left-[5%] w-[90%] h-[60%]" src="./rooms/about/blurb.png" />
                </div>
                <div className={"absolute " + (isMobile ? "top-[15%] left-[10%] w-[60%] h-[25%]" : "top-[20%] left-[42%] w-[30%] h-[30%]")}>
                    <img className="w-full h-full" src="./rooms/about/postit_red.png" />
                    <img className="absolute top-[23%] left-[10%] w-[80%] h-[10%]" src="./rooms/about/CreatedBy.png" />
                    <div id='credits' className="absolute top-[40%] left-[10%] w-[80%] flex flex-col justify-center text-black text-center font-serif">
                        <a href="https://www.instagram.com/cornjpg/" target="_blank">Cornelia Skrok</a>
                        <a href="https://www.instagram.com/katiewxitz/" target="_blank">Katie Weitz</a>
                        <a href="https://www.instagram.com/sylathas/" target="_blank">Niccolo Abate</a>
                    </div>
                </div>
                <div className={"absolute " + (isMobile ? "top-[70%] left-[15%] h-[30%] w-[60%]" : "top-[80%] left-[43%] h-[15%] w-[30%]")}>
                    <img className="w-full h-full" src="./rooms/about/postit_blue.png" />
                    <p className="font-serif text-black absolute top-[23%] left-[10%] w-[80%]">Want to contribute? Have any questions? Hate us? Send us an email or dm with the buttons around!</p>
                </div>
                <img className={"absolute " + (isMobile ? "top-[12%] left-[65%] w-[20%] h-[35%]" : "top-[30%] left-[68%] w-[10%] h-[60%]")} src="./rooms/about/keychain.png" />
                <img className={"shopCategories absolute " + (isMobile ? "top-[35%] left-[10%] w-[30%] h-[20%]" : "top-[15%] left-[20%] w-[10%] h-[20%]")} src="./rooms/about/email.png" />
                <a href="https://www.instagram.com/theechotimes/" target="_blank"><img className={"shopCategories absolute " + (isMobile ? "top-[70%] left-[70%] w-[25%] h-[15%]" : "top-[20%] left-[30%] w-[10%] h-[20%]")} src="./rooms/about/instagram.png" /></a>
            </div>
        )
    }
}