import { useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../store/AuthContext";

interface Props {
    room: number;
    roomChange: Function;
    goBack: Function;
    setLogin: Function;
    isMobile: boolean;
    menuOpen: any[];
}

export default function FloorControls({ room, roomChange, goBack, setLogin, isMobile, menuOpen }: Props) {
    const { user } = useContext(AuthContext);

    const [buttonUpSrc, setButtonUpSrc] = useState<string>("/rooms/overlay/buttons/FloorUp_inactive.png");
    const [buttonDownSrc, setButtonDownSrc] = useState<string>("/rooms/overlay/buttons/FloorDown_inactive.png");
    const [buttonBackSrc, setButtonBackSrc] = useState<string>("/rooms/overlay/buttons/back_inactive.png");
    const loginState = user
        ? "/rooms/overlay/login/logged_in.png"
        : "/rooms/overlay/login/logged_out.png";
    const [floorNumber, setFloorNumber] = useState<string>('/rooms/overlay/floorNumbers/Number_Floor1.png');

    useEffect(() => {
        if (room === 1) {
            setFloorNumber('/rooms/overlay/floorNumbers/Number_Floor1.png');
        } else if (room === 2) {
            setFloorNumber('/rooms/overlay/floorNumbers/Number_Floor2.png');
        } else if (room === 3) {
            setFloorNumber('/rooms/overlay/floorNumbers/Number_Shop.png');
        } else if (room === 4) {
            setFloorNumber('/rooms/overlay/floorNumbers/Number_Contact.png');
        }
    }, [room]);

    return (
        <>
            <div id='floorControls' className={'overlayLiftDoorsTwo absolute z-5 left-[2.5%] top-[30%] w-[25%] h-[35%] ' + (isMobile ? ("buttons" + menuOpen[1]) : "")}>
                {isMobile && <>
                    <img id="floorButtonsOutline" className='absolute left-[0] top-[40.5%] w-[100%] h-[63%] rotate-1' src="/rooms/overlay/overlay_LiftButtons.png"></img>
                    <img id="floorNumberOutline" className="absolute top-[0] left-[10%] w-[80%] h-[30%]" src="/rooms/overlay/overlay_screenNumber.png"></img>
                </>}
                <div id='buttons' className={'absolute rotate-1 flex flex-col justify-between ' + (isMobile ? "left-[5%] top-[43%] w-[75%] h-[58%]" : "left-[2.5%] top-[50%] w-[23%] h-[50%]")}>
                    <img className="w-full h-[40%] m-[5%]" src={buttonUpSrc} alt='Lift floor-up button.' onClick={() => roomChange(true)} onMouseLeave={() => setButtonUpSrc("/rooms/overlay/buttons/FloorUp_inactive.png")} onMouseDown={() => setButtonUpSrc("/rooms/overlay/buttons/FloorUp_active.png")}></img>
                    <img className="w-full h-[40%] m-[5%]" src={buttonDownSrc} alt='Lift floor-down button.' onClick={() => roomChange(false)} onMouseLeave={() => setButtonDownSrc("/rooms/overlay/buttons/FloorDown_inactive.png")} onMouseDown={() => setButtonDownSrc("/rooms/overlay/buttons/FloorDown_active.png")}></img>
                </div>
                <img className={"absolute " + (isMobile ? "top-[8%] left-[30%] w-[40%] h-[15%]" : "top-[9%] left-[5%] w-[18%] h-[15%]")} src={floorNumber}></img>
            </div>
            {!isMobile && <>
                <div id='login' className="overlayLiftDoorsTwo absolute z-5 right-[2.5%] top-[10%] w-[8%] h-[14%]" onClick={() => { setLogin(true) }}>
                    <img id="loginOutline" className="w-full h-full" src="/rooms/overlay/overlay_login.png"></img>
                    <img id="loginButton" className="absolute left-[30%] top-[20%] w-[40%] h-[30%]" src={loginState}></img>
                </div>
                <div id='back' className="absolute z-5 right-[1.5%] top-[40%] w-[10%] h-[15%]" onClick={() => goBack()}>
                    <img id="backOutline" className="w-full h-full" src="/rooms/overlay/overlay_back.png"></img>
                    <img className="absolute left-[10%] top-[10%] h-[80%] w-[90%]" src={buttonBackSrc} alt='Back button.' onMouseLeave={() => setButtonBackSrc("/rooms/overlay/buttons/back_inactive.png")} onMouseDown={() => setButtonBackSrc("/rooms/overlay/buttons/back_active.png")}></img>
                </div>
            </>}
        </>
    )
}