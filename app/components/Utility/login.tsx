import { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../store/AuthContext";
import { FirebaseError } from "firebase/app";
import { generateFirebaseAuthErrorMessage } from "../../lib/firebase/ErrorHandler";

interface Props {
    setLogin: Function;
}

export default function Auth({ setLogin }: Props) {
    //section: 0 = initial, 1 = log-in, 2 = sign-up, 3 = success, 4 = error
    //context
    const { user, profile } = useContext(AuthContext);
    //general
    const [section, setSection] = useState<any[]>([0, 0])
    const [closeTop, setCloseTop] = useState<string>("closesection0")
    const [closeSrc, setCloseSrc] = useState<string>("rooms/overlay/login/modal/buttons/close_inactive.png")
    const modalHeight = "modalsection" + section[0];

    //for auth
    const { signIn, signUp, signOut, redeemCode } = useContext(AuthContext);
    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [repeatPassword, setRepeatPassword] = useState<string>("")
    const [zineCode, setZineCode] = useState<string>("")

    //errors
    const [loginError, setLoginError] = useState<string>("");
    const [signupError, setSignupError] = useState<string>("");

    const handleLogin = async () => {
        setLoginError("");
        try {
            await signIn({ email: email, password });
            setSection([3, 1]);
        } catch (error) {
            if (error instanceof FirebaseError) {
                setLoginError(generateFirebaseAuthErrorMessage(error));
            } else {
                setLoginError("Oops! Something went wrong. Please try again later.");
            }
        }
    };

    const handleSignUp = async () => {
        if (password !== repeatPassword) {
            setSignupError("Passwords do not match.");
            return;
        }
        try {
            await signUp({ email, password, displayName: username, zineCode });
            setSection([3, 2]);
        } catch (error) {
            if (error instanceof FirebaseError) {
                setSignupError(generateFirebaseAuthErrorMessage(error));
            } else {
                setSignupError("Oops! Something went wrong. Please try again later.");
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            setLogin(false)
        } catch (error) {
            console.log('sign-out error')
        }
    };

    const handleRedeemCode = async () => {
        try {
            redeemCode(zineCode)
        } catch (error) {
            console.error("couldn't redeem the code: ", error);
        }
    }

    return (
        <div id="authModal" className="absolute z-6 w-[50%] h-[100%] left-[25%] top-[0]">
            <img id='modal' src="rooms/overlay/login/modal/modal.png" className={"absolute w-full " + modalHeight} />
            <img id="close" src={closeSrc} className={"absolute h-[12%] w-[10%] right-[0] " + closeTop} onClick={() => setLogin(false)} onMouseLeave={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_inactive.png")} onMouseDown={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_active.png")} />
            {section[0] === 0 && (
                <div>
                    {
                        user ? (
                            <>
                                <img src="rooms/overlay/login/modal/texts/welcomeback.png" className={"absolute w-[80%] h-[15%] left-[10%] top-[30%]"} />
                                <img src="rooms/overlay/login/modal/buttons/sign-out.png" className="authbutton absolute w-[40%] h-[20%] left-[7.5%] bottom-[30%]" onClick={handleSignOut} />
                                <img src="rooms/overlay/login/modal/buttons/your-account.png" className="authbutton absolute w-[40%] h-[20%] right-[7.5%] bottom-[30%]" onClick={() => { setSection([4, 0]) }} />
                            </>
                        ) : (
                            <>
                                <img src="rooms/overlay/login/modal/texts/welcome.png" className={"absolute w-[60%] h-[15%] left-[20%] top-[30%]"} />
                                <img src="rooms/overlay/login/modal/buttons/login_initial.png" className="authbutton absolute w-[40%] h-[20%] left-[7.5%] bottom-[30%]" onClick={() => { setSection([1, 0]) }} />
                                <img src="rooms/overlay/login/modal/buttons/signup-initial.png" className="authbutton absolute w-[40%] h-[20%] right-[7.5%] bottom-[30%]" onClick={() => { setSection([2, 0]) }} />
                            </>
                        )
                    }
                </div>
            )}
            {section[0] === 1 && (
                <div>
                    <div id="login_usernameemail" className="absolute w-[90%] h-[10%] left-[5%] top-[25%]">
                        <img src="rooms/overlay/login/modal/texts/email.png" className="absolute h-[25%] w-[30%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[33%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/long1.png" className="absolute h-[65%] w-full left-[0] top-[40%]" />
                        <input
                            type="text"
                            id="login_email"
                            className="authinput absolute h-[65%] w-full left-[5%] top-[40%] font-serif"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div id="login_password" className="absolute w-[90%] h-[10%] left-[5%] top-[43%]">
                        <img src="rooms/overlay/login/modal/texts/password.png" className="absolute h-[25%] w-[40%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[43%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/long2.png" className="absolute h-[65%] w-full left-[0] top-[40%]" />
                        <input
                            type="password"
                            id="login_password"
                            className="authinput absolute h-[65%] w-full left-[5%] top-[35%] font-serif"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <p id="errorTextLogin" className="errorText absolute left-[10%] top-[55%] text-center">{loginError}</p>
                    <img src="rooms/overlay/login/modal/buttons/login_final.png" className="authbutton absolute w-[55%] h-[15%] right-[11%] bottom-[25%]" onClick={handleLogin} />
                    <img src="rooms/overlay/login/modal/buttons/back.png" className="authbutton absolute w-[20%] h-[10%] left-[10%] bottom-[27.5%]" onClick={() => { setSection([section[1], 1]) }} />
                </div>
            )}
            {section[0] === 2 && (
                <div>
                    <div id="signup_username" className="absolute w-[90%] h-[10%] left-[5%] top-[15%]">
                        <img src="rooms/overlay/login/modal/texts/username.png" className="absolute h-[25%] w-[30%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[35%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/long1.png" className="absolute h-[65%] w-full left-[0] top-[40%]" />
                        <input
                            type="text"
                            id="signup_username"
                            className="authinput absolute h-[65%] w-full left-[5%] top-[40%] font-serif"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div id="signup_email" className="absolute w-[90%] h-[10%] left-[5%] top-[30%]">
                        <img src="rooms/overlay/login/modal/texts/email.png" className="absolute h-[25%] w-[25%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[30%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/long2.png" className="absolute h-[65%] w-[95%] left-[0] top-[40%]" />
                        <input
                            type="text"
                            id="signup_email"
                            className="authinput absolute h-[65%] w-full left-[5%] top-[40%] font-serif"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div id="signup_password" className="absolute w-[90%] h-[10%] left-[5%] top-[44%]">
                        <img src="rooms/overlay/login/modal/texts/password.png" className="absolute h-[25%] w-[20%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[25%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/short1.png" className="absolute h-[65%] w-[45%] left-[0] top-[40%]" />
                        <input
                            type="password"
                            id="signup_password"
                            className="authinput absolute h-[65%] w-[45%] left-[5%] top-[35%] font-serif"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <img src="rooms/overlay/login/modal/texts/repeat.png" className="absolute h-[25%] w-[20%] left-[50%] top-[0]" />
                        <img src="rooms/overlay/login/modal/texts/required.png" className="absolute h-[20%] w-[20%] left-[75%] top-[10%]" />
                        <img src="rooms/overlay/login/modal/bars/short2.png" className="absolute h-[65%] w-[45%] left-[50%] top-[40%]" />
                        <input
                            type="password"
                            id="signup_repeat"
                            className="authinput absolute h-[65%] w-[45%] left-[55%] top-[37%] font-serif"
                            name="repeat"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                        />
                    </div>
                    <div id="signup_code" className="absolute h-[9%] w-[90%] left-[6%] top-[57%]">
                        <img src="rooms/overlay/login/modal/texts/zine_code.png" className="absolute h-[25%] w-[25%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/bars/long1.png" className="absolute h-[65%] w-[90%] left-[0] top-[40%]" />
                        <input
                            type="text"
                            id="signup_code"
                            className="authinput absolute h-[65%] w-full left-[5%] top-[40%] font-serif"
                            name="zinecode"
                            value={zineCode}
                            onChange={(e) => setZineCode(e.target.value)}
                        />
                    </div>
                    <p id="errorTextSignup" className="errorText absolute left-[55%] top-[69%] text-center">{signupError}</p>
                    <img src="rooms/overlay/login/modal/buttons/signup_final.png" className="authbutton absolute w-[55%] h-[10%] right-[11%] bottom-[16%]" onClick={handleSignUp} />
                    <img src="rooms/overlay/login/modal/buttons/back.png" className="authbutton absolute w-[20%] h-[10%] left-[10%] bottom-[16%]" onClick={() => { setSection([section[1], 2]) }} />
                </div>
            )}
            {section[0] === 3 && (
                <div>
                    <img src="rooms/overlay/login/modal/success.png" className="absolute w-[70%] h-[30%] left-[15%] top-[32%]" />
                </div>
            )}
            {section[0] === 4 && (
                <div>
                    <div id="account_username" className="absolute w-[90%] h-[10%] left-[5%] top-[25%]">
                        <img src="rooms/overlay/login/modal/texts/username.png" className="absolute h-[25%] w-[30%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/bars/long1.png" className="absolute h-[65%] w-full left-[0] top-[40%]" />
                        <p className="authinput absolute h-[65%] w-full left-[5%] top-[55%] font-serif">{profile?.displayName ?? user?.displayName ?? ""}</p>
                    </div>
                    <div id="account_email" className="absolute w-[90%] h-[10%] left-[5%] top-[38%]">
                        <img src="rooms/overlay/login/modal/texts/email.png" className="absolute h-[25%] w-[25%] left-[0] top-[0]" />
                        <img src="rooms/overlay/login/modal/bars/long2.png" className="absolute h-[65%] w-[93%] left-[0] top-[40%]" />
                        <p id="account_email" className="authinput absolute h-[65%] w-full left-[5%] top-[55%] font-serif">{user?.email ?? profile?.email ?? ""}</p>
                    </div>
                    <div id="account_code" className="absolute h-[9%] w-[90%] left-[6%] top-[50%]">
                        <img src="rooms/overlay/login/modal/texts/zine_code.png" className="absolute h-[25%] w-[25%] left-[0] top-[0]" />
                        <p id="account_zine1" className="authinput absolute h-[65%] w-[40%] left-[28%] top-[-2%] font-serif text-black">TET1<img className="absolute w-[10%] h-[50%] left-[40%] top-[-2%]" src={profile?.zine1 ? "/rooms/overlay/login/logged_in.png" : "/rooms/overlay/login/logged_out.png"} /></p>
                        <p id="account_zine2" className="authinput absolute h-[65%] w-[40%] left-[60%] top-[-2%] font-serif text-black">TET2<img className="absolute w-[10%] h-[50%] left-[40%] top-[-2%]" src={profile?.zine2 ? "/rooms/overlay/login/logged_in.png" : "/rooms/overlay/login/logged_out.png"} /></p>
                    </div>
                    <img src="rooms/overlay/login/modal/bars/long2.png" className="absolute h-[5%] w-[90%] left-[5%] top-[55%]" />
                    <input
                        type="text"
                        id="signup_code"
                        className="authinput absolute h-[5%] w-[88%] left-[7%] top-[54.5%] font-serif"
                        name="zinecode"
                        value={zineCode}
                        onChange={(e) => setZineCode(e.target.value)}
                    />
                    <img src="rooms/overlay/login/modal/buttons/back.png" className="authbutton absolute w-[30%] h-[15%] left-[8%] bottom-[22%]" onClick={() => { setSection([section[1], 4]) }} />
                    <img src="rooms/overlay/login/modal/buttons/add-code.png" className="authbutton absolute w-[40%] h-[15%] left-[50%] bottom-[23%]" onClick={handleRedeemCode} />
                </div>
            )
            }
        </div >
    )
}