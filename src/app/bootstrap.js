import { Router } from "./router.js";
import { renderMarketingPage, mountMarketingPage } from "../features/marketing/marketingPage.js";
import { renderPlatformPage } from "../features/platform/platformPage.js";
import { renderStoriesPage } from "../features/stories/storiesPage.js";
import { renderTrustPage } from "../features/trust/trustPage.js";
import { renderMapPage } from "../features/map/mapPage.js";
import { renderDashboardPage } from "../features/dashboard/dashboardPage.js";
import { mountRequestPage, renderRequestPage } from "../features/requests/requestPage.js";
const root=document.querySelector("#app");if(!(root instanceof HTMLElement))throw new Error("App root not found");
/** @type {Router} */ let router;
router=new Router({root,routes:[
 {path:"/",title:"داستان داده و تصمیم",description:"رهجو؛ پلتفرم روایت‌محور برای داده، تصمیم و پیگیری قابل ممیزی.",render:renderMarketingPage,mount:()=>mountMarketingPage(()=>router.handleNavigation())},
 {path:"/platform",title:"پلتفرم",render:renderPlatformPage},{path:"/stories",title:"دفتر روایت",render:renderStoriesPage},{path:"/trust",title:"مرکز اعتماد",render:renderTrustPage},{path:"/map",title:"نقشه پلتفرم",render:renderMapPage},{path:"/dashboard",title:"میز تصمیم",render:renderDashboardPage},{path:"/request",title:"جریان درخواست",render:renderRequestPage,mount:()=>mountRequestPage(()=>router.handleNavigation())}
]});router.start();
