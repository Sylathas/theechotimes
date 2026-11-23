"use client"

import "./style.css";
import { useState, useEffect, useRef } from "react";
import FloorControls from "./components/floorControls";
import Floor from "./components/floor";
import Zine from "./components/Zine/zine";
import Auth from "./components/Utility/login";
import AuthProvider from "./store/AuthContext";
import Tutorial from "./components/Utility/tutorial";
import { useIsMobile } from "./hooks/useismobile";

export default function Home() {
  const isMobile = useIsMobile();
  const [activeRoom, setActiveRoom] = useState<number>(1);
  const [zineOn, setZineOn] = useState<boolean>(false);
  const [shopOn, setShopOn] = useState<boolean>(false);
  const [animationTrigger, setAnimationTrigger] = useState<boolean>(true)
  const [login, setLogin] = useState<boolean>(false)
  const [tutorialOn, setTutorialOn] = useState<boolean>(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [toolsOpen, setToolsOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<any[]>(["Closed", "Closed"]);

  const [zineSection, setZineSection] = useState<number>(0)
  const [background, setBackground] = useState<string>("./rooms/floors/backgrounds/1.jpg")

  const [shopSection, setShopSection] = useState<number>(0)

  const busy = useRef(false);

  const roomChange = (up: boolean) => {
    const next = up ? activeRoom + 1 : activeRoom - 1;
    if (isMobile) {
      if (next < 3 || next > 4) return;
      setMenuOpen(["Closed", "Closed"])
      transition(() => {
        setActiveRoom(next);
        setZineOn(false);
        setZineSection(0);
        setShopSection(0);
        setShopOn(false);
      });
    } else {
      if (next < 1 || next > 4) return;
      transition(() => {
        setActiveRoom(next);
        setBackground(`./rooms/floors/backgrounds/${next}.jpg`);
        setZineOn(false);
        setZineSection(0);
        setShopSection(0);
        setShopOn(false);
      });
    }
  };

  const activateZine = () => transition(() => { setZineSection(0); setZineOn(true); });

  const goBack = () => {
    if (shopOn) {
      if (shopSection === 2) {
        setShopSection(1);
      } else {
        setShopSection(0);
        setShopOn(false);
      }
    } if (zineOn) {
      if (zineSection === 1) changeSection(0);
      else transition(() => setZineOn(false));
    } else return
  };

  const changeSection = (next: number) => {
    if (next === zineSection) return;
    transition(() => setZineSection(next));
  };

  // Closes the doors, makes the change while they're closed, then opens them again
  const transition = (change: () => void) => {
    if (busy.current) return;
    busy.current = true;
    setAnimationTrigger(true);
    setTimeout(change, 1000);
    setTimeout(() => { setAnimationTrigger(false); busy.current = false; }, 1200);
  };

  const menuToggled = (direction: string) => {
    if (direction === "dx") {
      if (menuOpen[0] === "Closed") setMenuOpen(["Open", menuOpen[1]])
      else setMenuOpen(["Closed", menuOpen[1]])
    } else {
      if (menuOpen[1] === "Closed") setMenuOpen([menuOpen[0], "Open"])
      else setMenuOpen([menuOpen[0], "Closed"])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setAnimationTrigger(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMobile) return
    setActiveRoom(3);
  }, [isMobile])

  return (
    <AuthProvider>
      <main className="w-full h-full">
        <div className='w-full h-auto image-pixelated' id='lift-overlay'>
          <Tutorial room={activeRoom} section={zineSection} zineOn={zineOn} tutorialOn={tutorialOn} setTutorialOn={setTutorialOn} isModifying={isModifying} setToolsOpen={setToolsOpen} isMobile={isMobile} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          {!isMobile ? (
            <div id='overlayLiftDoors' className='absolute z-3 w-full h-full pointer-events-none'>
              <img id='overlayLiftDoorL' className={"overlayLiftDoors absolute w-[40%] h-full " + (!animationTrigger && "animOverlayDoorOpenL")} src="/rooms/overlay/Overlay_doorL.png"></img>
              <img id='overlayLiftDoorR' className={"overlayLiftDoors absolute w-[40%] h-full " + (!animationTrigger && "animOverlayDoorOpenR")} src="/rooms/overlay/Overlay_doorR.png"></img>
              <img className="absolute w-full h-full pointer-events-none" src='/rooms/overlay/Overlay_side.png' alt="Overlay of the Lift Doors"></img>
            </div>
          ) : (
            <>
              <div id='overlayLiftDoors' className='absolute z-3 w-full h-[100%] pointer-events-none'>
                <img id='overlayLiftDoorL' className={"overlayLiftDoors absolute w-[60%] h-full " + (animationTrigger ? "animOverlayDoorOpenLMobile" : "animOverlayDoorOpenL")} src="/rooms/overlay/Overlay_doorL.png"></img>
                <img id='overlayLiftDoorR' className={"overlayLiftDoors absolute w-[60%] h-full " + (animationTrigger ? "animOverlayDoorOpenRMobile" : "animOverlayDoorOpenR")} src="/rooms/overlay/Overlay_doorR.png"></img>
              </div>
              <div id='mobileOverlayDx' className={"z-3 overlayLiftDoorsTwo absolute w-[90%] h-full right-[0] overlaydx" + menuOpen[0]}>
                <img id='overlaydx' className="w-full h-full" src='/rooms/overlay/Overlay_mobile_dx.png' alt="Overlay of the Lift Doors on the left side"></img>
                <div className="absolute h-[20%] w-[30%] left-[0] top-[27%]" onClick={() => menuToggled("dx")}></div>
              </div>
              <div id='mobileOverlayDx' className={"z-3 overlayLiftDoorsTwo absolute w-[90%] h-full overlaysx" + menuOpen[1]}>
                <img id='overlaysx' className="w-full h-full" src='/rooms/overlay/Overlay_mobile_sx.png' alt="Overlay of the Lift Doors on the right side"></img>
                <div className="absolute h-[20%] w-[30%] right-[0] bottom-[13%]" onClick={() => menuToggled("sx")}></div>
              </div>
            </>
          )}
          <FloorControls room={activeRoom} roomChange={roomChange} goBack={goBack} setLogin={setLogin} isMobile={isMobile} menuOpen={menuOpen}></FloorControls>
          {!zineOn && (<Floor room={activeRoom} zineOn={activateZine} setShopOn={setShopOn} shopOn={shopOn} shopSection={shopSection} setShopSection={setShopSection} isMobile={isMobile}></Floor>)}
          {zineOn && (<Zine room={activeRoom} section={zineSection} changeSection={changeSection} isModifying={isModifying} setIsModifying={setIsModifying} toolsOpen={toolsOpen} setToolsOpen={setToolsOpen} />)}
          {login && <Auth setLogin={setLogin}></Auth>}
          <img id="background" className="w-full h-full z-0" src={background}></img>
        </div>
      </main>
    </AuthProvider>
  );
}
