import { useState, useEffect } from "react";
import { shopProducts } from "@/app/lib/firebase";

interface Props {
    shopSection: number;
    setShopSection: Function;
    setShopOn: Function;
    shopOn: boolean;
    isMobile: boolean;
}

type Zone = "domestic" | "europe" | "world";

// For display only: the server charges the prices in app/api/checkout/route.ts, so keep the two in step
const SHIPPING: Record<Zone, { label: string; price: number }> = {
    domestic: { label: "UK", price: 350 },
    europe: { label: "Europe", price: 700 },
    world: { label: "Rest of the world", price: 1200 },
};

const formatPrice = (pence: number) => "£" + (pence / 100).toFixed(2);

export default function Shop({ shopSection, setShopSection, setShopOn, shopOn, isMobile }: Props) {
    const [productData, setProductData] = useState<any>()
    const [categoryOpened, setCategoryOpened] = useState<string>("")
    const [productOpen, setProductOpen] = useState<any>()
    const [cart, setCart] = useState<any[]>([])
    const [cartOpen, setCartOpen] = useState<boolean>(false)
    const [closeSrc, setCloseSrc] = useState<string>("rooms/overlay/login/modal/buttons/close_inactive.png")

    //checkout
    const [zone, setZone] = useState<Zone>("domestic")
    const [checkingOut, setCheckingOut] = useState<boolean>(false)
    const [checkoutError, setCheckoutError] = useState<string>("")

    const sectionPosition = shopOn ? -100 : 0;

    // The cart grouped by product, with a quantity for each
    const basket = Object.values(cart.reduce((grouped: Record<string, any>, product: any) => {
        const existing = grouped[product.id];
        grouped[product.id] = existing ? { ...existing, quantity: existing.quantity + 1 } : { ...product, quantity: 1 };
        return grouped;
    }, {}));
    const cartTotal = cart.reduce((sum: number, product: any) => sum + product.price, 0);

    // Whether another copy of the open product can be added
    const openInCart = cart.filter((p) => p.id === productOpen?.id).length;
    const outOfStock = typeof productOpen?.stock === "number" && openInCart >= productOpen.stock;

    useEffect(() => {
        const getShopData = async () => {
            await shopProducts()
                .then((response) => {
                    setProductData(response);
                });
        }
        getShopData()
    }, [])

    // Bring the cart back after leaving for Stripe, or empty it after a successful payment
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get("order") === "success") {
                localStorage.removeItem("cart");
                window.history.replaceState(null, "", window.location.pathname);
                return;
            }
            const saved = localStorage.getItem("cart");
            if (saved) setCart(JSON.parse(saved));
        } catch { }
    }, [])

    useEffect(() => {
        try { localStorage.setItem("cart", JSON.stringify(cart)); } catch { }
    }, [cart])

    function openCategory(category: any) {
        setShopSection(1)
        setCategoryOpened(category)
        setShopOn(true);
    }

    function openProduct(product: any) {
        setShopSection(2)
        setProductOpen(product)
    }

    function addToBasket() {
        if (!productOpen || outOfStock) return;
        setCart([...cart, productOpen]);
        setShopSection(1);
    }

    function goBack() {
        if (shopOn) {
            if (shopSection === 2) {
                setShopSection(1);
            } else {
                setShopSection(0);
                setShopOn(false);
            }
        }
    }

    // Removes one copy of a product
    function removeProduct(id: string) {
        const index = cart.findIndex((p) => p.id === id);
        if (index !== -1) setCart(cart.filter((_, i) => i !== index));
    }

    async function checkout() {
        if (checkingOut || cart.length === 0) return;
        setCheckingOut(true);
        setCheckoutError("");
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: basket.map((p: any) => ({ id: p.id, quantity: p.quantity })),
                    zone,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            window.location.href = data.url;
        } catch (error) {
            setCheckoutError(error instanceof Error && error.message ? error.message : "Checkout isn't available right now. Try again in a moment.");
            setCheckingOut(false);
        }
    }

    return (
        <>
            <div id="section1" className="shopSection absolute inset-0 w-full h-full" style={{ transform: `translateY(${sectionPosition}%)` }}>
                <div id='section1Sizes' className={"absolute h-full w-[" + (isMobile ? "90%" : "50%") + "] left-[" + (isMobile ? "5%" : "25%") + "]"}>
                    <img id="shelf" className={"absolute w-full bottom-[0] " + (isMobile ? "h-[50%]" : "h-[40%]")} src="rooms/shop/step1/shelf.png"></img>
                    <img id="smile" className={"absolute h-[30%] " + (isMobile ? "w-[90%] left-[5%]" : "w-full") + " top-[5%]"} src="rooms/shop/step1/smile_text.png"></img>
                    <img id="zineCategory" className={"shopCategories absolute w-[24%] left-[15%] " + (isMobile ? "h-[15%] bottom-[47.5%]" : "h-[25%] bottom-[37.5%]")} src="rooms/shop/step1/zine2_cover.webp" onClick={() => openCategory('zines')}></img>
                    <img id="merchCategory" className={"shopCategories absolute w-[40%] right-[10%] " + (isMobile ? "h-[15%] bottom-[47.5%]" : "h-[25%] bottom-[37.5%]")} src="rooms/shop/step1/tee_green_L.webp" onClick={() => openCategory('merch')}></img>
                </div>
            </div>
            <div id="section2" className="shopSection absolute inset-0 w-full h-full text-center" style={{ transform: "translateY(" + (sectionPosition + 100) + "%)" }}>
                <img id="crate" className={"absolute h-[90%] bottom-[5%] " + (isMobile ? "w-[90%] left-[5%]" : "w-[50%] left-[25%]")} src="rooms/shop/step2/crate.png"></img>
                {categoryOpened === "zines" ?
                    <div>
                        <div id='zine1' className={"shopCategories absolute " + (isMobile ? "h-[30%] w-[50%] left-[25%] top-[12%]" : "h-[40%] w-[18%] left-[30%] bottom-[30%]")} onClick={() => { openProduct(productData?.[3]) }}>
                            <img className="w-full h-full" src={productData?.[3].cover}></img>
                            <p className="font-serif">{productData?.[3].name}</p>
                        </div>
                        <div id='zine2' className={"shopCategories absolute " + (isMobile ? "h-[30%] w-[50%] right-[25%] top-[48%]" : "h-[40%] w-[18%] right-[30%] bottom-[30%]")} onClick={() => { openProduct(productData?.[4]) }}>
                            <img className="w-full h-full" src={productData?.[4].cover}></img>
                            <p className="font-serif">{productData?.[4].name}</p>
                        </div>
                    </div>
                    : <div className={isMobile ? "absolute w-full h-[70%] top-[10%] overflow-y-scroll flex flex-col items-center justify-center" : ""}>
                        <div id='tankTopPink' className={"shopCategories " + (isMobile ? "h-[30%] w-[30%] mt-[60%]" : "absolute h-[30%] w-[15%] left-[30%] bottom-[60%]")} onClick={() => { openProduct(productData?.[2]) }}>
                            <img className="w-full h-full" src={productData?.[2].cover}></img>
                            <p className="font-serif">{productData?.[2].name}</p>
                        </div>
                        <div id='teeGreenM' className={"shopCategories " + (isMobile ? "h-[30%] w-[50%] mt-[30%]" : "absolute h-[30%] w-[15%] right-[30%] bottom-[60%]")} onClick={() => { openProduct(productData?.[1]) }}>
                            <img className="w-full h-full" src={productData?.[1].cover}></img>
                            <p className="font-serif">{productData?.[1].name}</p>
                        </div>
                        <div id='teeGreenL' className={"shopCategories " + (isMobile ? "h-[30%] w-[50%] mt-[30%]" : "absolute h-[30%] w-[15%] right-[40%] bottom-[25%]")} onClick={() => { openProduct(productData?.[0]) }}>
                            <img className="w-full h-full" src={productData?.[0].cover}></img>
                            <p className="font-serif">{productData?.[0].name}</p>
                        </div>
                    </div>
                }
                {isMobile && <img className="absolute w-[80%] h-[10%] left-[10%] top-[0%]" onClick={goBack} src="rooms/shop/step2/categoriesButton.png" />}
            </div >
            {shopSection === 2 && (
                <div id="section3" className="absolute inset-0 w-full h-full z-1000">
                    <div className="w-full h-full bg-black opacity-80"></div>
                    {isMobile && <div id='productNameMobile' className="absolute w-full top-[3%] font-serif text-[20px] text-center text-black bg-white">{productOpen?.name}</div>}
                    <div id='images' className={"absolute overflow-x-scroll flex flex-nowrap " + (isMobile ? "left-[15%] top-[10%] h-[50%] w-[70%]" : "left-[25%] bottom-[36%] h-[50%] w-[50%]")}>
                        <img className="h-full w-auto mr-[5%] shrink-0" src={productOpen?.cover}></img>
                        {productOpen?.images?.map((image: string, index: number) => (
                            <img key={`${image}-${index}`} className="h-full w-auto mr-[5%] shrink-0" src={image} />
                        ))}
                    </div>
                    <div id='productInfo' className={"absolute font-serif " + (isMobile ? "text-[20px] text-center w-full top-[62%]" : "left-[22%] bottom-[28%] text-[150%]")}>
                        {!isMobile && productOpen?.name + "-"} {formatPrice(productOpen?.price ?? 0)}
                    </div>
                    <div id='description' className={"absolute " + (isMobile ? "h-[15%] w-[70%] left-[15%] top-[65%]" : "h-[20%] w-[40%] left-[22%] bottom-[5%]")}>
                        <img className="w-full h-full" src="rooms/shop/step3/descriptionbox.png" />
                        <p className="absolute w-[90%] h-[80%] top-[20%] left-[3%] pb-[10%] font-serif text-black overflow-y-scroll">{productOpen?.description}</p>
                    </div>
                    <img className={"authbutton absolute " + (isMobile ? "h-[7.5%] w-[50%] left-[25%] top-[82%]" : "h-[10%] w-[10%] right-[25%] bottom-[13%]")} src="rooms/shop/step3/addtobasket.png"
                        style={{ opacity: outOfStock ? 0.4 : 1 }} onClick={addToBasket} />
                    {outOfStock && (
                        <p className="absolute right-[25%] bottom-[9%] font-serif">
                            {productOpen.stock === 0 ? "Sold out" : "All remaining stock is in your basket"}
                        </p>
                    )}
                </div>
            )}
            {shopSection === 2 && isMobile && <img className="absolute w-[25%] h-[5%] left-[37.5%] bottom-[3%] z-1001" onClick={goBack} src="/rooms/overlay/login/modal/buttons/close_inactive.png" />}
            <div id="cart">
                <div id='cartButton' className={'authbutton absolute bottom-[3%] ' + (isMobile ? "w-[60%] left-[20%] h-[8%]" : "w-[20%] left-[40%] h-[10%]")} onClick={() => setCartOpen(open => !open)}>
                    <img className="w-full h-full" src="rooms/shop/Cart.png" />
                    <p className={"absolute text-center w-[30%] top-[28%] left-[50%] text-black text-[150%]"}>{formatPrice(cartTotal)}</p>
                </div>
                {cartOpen && (
                    <div className={"z-1001 absolute h-[80%] top-[5%] " + (isMobile ? "w-[80%] left-[10%]" : "w-[50%] left-[25%]")}>
                        <img src="rooms/zine/generalFrame.png" className="w-full h-full" />
                        {!isMobile && <img src={closeSrc} className="absolute h-[8%] w-[10%] right-[-5%] top-[-2%]" onClick={() => setCartOpen(false)}
                            onMouseUp={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_inactive.png")}
                            onMouseLeave={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_inactive.png")}
                            onMouseDown={() => setCloseSrc("/rooms/overlay/login/modal/buttons/close_active.png")} />}
                        {cart.length === 0 ? (
                            <p className="absolute font-serif text-black text-[150%] w-full top-[5%] text-center">Cart is empty!</p>
                        ) : (
                            <>
                                <div id='cartProducts' className="absolute left-[5%] top-[5%] h-[70%] w-[90%] flex flex-col overflow-y-auto">
                                    {basket.map((product: any) => (
                                        <div key={product.id} className={"h-[20%] w-full mb-[5%] flex shrink-0 text-black font-serif items-center justify-between " + (isMobile && "flex-col")}>
                                            <img src={product.cover} className="h-full w-auto" />
                                            <span>{product.name}{product.quantity > 1 && ` ×${product.quantity}`}</span>
                                            <span>{formatPrice(product.price * product.quantity)}</span>
                                            <img src="rooms/overlay/login/modal/error.png" className="h-[30%] w-auto cursor-pointer" onClick={() => removeProduct(product.id)} />
                                        </div>
                                    ))}
                                </div>
                                <div id='cartShipping' className={"absolute left-[5%] bottom-[17%] flex justify-around text-black font-serif " + (isMobile ? "flex-col w-[70%] left-[20%]" : "w-[90%] left-[5%]")}>
                                    <label>
                                        Ship to
                                        <select value={zone} onChange={(e) => setZone(e.target.value as Zone)} className={"bg-transparent border border-black " + (!isMobile && "ml-[2px]")}>
                                            {(Object.keys(SHIPPING) as Zone[]).map((key) => (
                                                <option key={key} value={key}>{SHIPPING[key].label} ({formatPrice(SHIPPING[key].price)})</option>
                                            ))}
                                        </select>
                                    </label>
                                    <span>Total {formatPrice(cartTotal + SHIPPING[zone].price)}</span>
                                </div>
                                {checkoutError && <p className="absolute left-[5%] bottom-[16%] w-[90%] text-red-700 font-serif">{checkoutError}</p>}
                                <img src="rooms/shop/checkout.png" className={"authbutton absolute h-[10%] bottom-[5%] " + (isMobile ? "w-[70%] left-[15%]" : "w-[30%] left-[35%]")}
                                    style={{ opacity: checkingOut ? 0.5 : 1 }} onClick={checkout} />
                            </>
                        )}
                    </div>
                )}
            </div >
        </>
    )
}