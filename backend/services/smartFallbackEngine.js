/**
 * Smart Offline & Fallback Startup Advisory Engine
 * Generates comprehensive, multi-phase execution roadmaps and deep startup advisory
 * when AI models are rate-limited (429) or offline.
 */

function extractDomain(text) {
  const lower = (text || '').toLowerCase();
  if (/\b(ecommerce|e-commerce|d2c|online store|retail|shopping|handmade|craft|products|clothing|fashion|jewellery)\b/i.test(lower)) {
    return 'ecommerce';
  }
  if (/\b(agri|agriculture|agritech|farming|farm|crop|fpo|tractor|equipment)\b/i.test(lower)) {
    return 'agritech';
  }
  if (/\b(fintech|finance|banking|payment|payments|lending|crypto|loan|upi)\b/i.test(lower)) {
    return 'fintech';
  }
  if (/\b(health|healthcare|healthtech|medical|pharma|biotech|clinic|doctor|diagnostic)\b/i.test(lower)) {
    return 'healthtech';
  }
  if (/\b(edtech|education|learning|upskilling|students|teaching|course|school|college)\b/i.test(lower)) {
    return 'edtech';
  }
  if (/\b(saas|software|b2b|enterprise|cloud|devtool|platform|api)\b/i.test(lower)) {
    return 'saas';
  }
  return 'general';
}

function isRoadmapQuery(text) {
  const lower = (text || '').toLowerCase();
  return /\b(roadmap|road map|execution plan|milestone|phases|step by step|timeline|guide to start|how to start|how to launch|pathway|stage by stage)\b/i.test(lower);
}

function generateRoadmapText(domain, lang, founderContext = {}, dbResources = [], mentors = []) {
  const startupName = founderContext.startupName || 'Your Startup';

  if (domain === 'ecommerce') {
    if (lang === 'ta') {
      return `🗺️ **${startupName} - ஈ-காமர்ஸ் (E-Commerce) ஸ்டார்ட்அப் முழுமையான வழிகாட்டி (6-Phase Execution Roadmap)**

💡 *ஈ-காமர்ஸ் துறையில் ஒரு வெற்றிகரமான பிராண்டை உருவாக்க திட்டமிட்ட 6 கட்ட செயல்முறை திட்டம்:*

---

### 🎯 கட்டம் 1: யோசனை உறுதிப்படுத்தல் & தயாரிப்பு தேர்வு (Month 1)
• **Niche & Product Selection**: அதிக லாப வரம்பு (Minimum 40-60% gross margin) மற்றும் தொடர் தேவை கொண்ட தயாரிப்புகளைத் தேர்வு செய்யுங்கள்.
• **Competitor & Market Research**: அமேசான், மீஷோ, இன்ஸ்டாகிராம் ஆகியவற்றில் உள்ள சிறந்த விற்பனையாளர்களின் விலை, தரம் மற்றும் வாடிக்கையாளர் விமர்சனங்களை ஆய்வு செய்யுங்கள்.
• **Sample Testing**: 5-10 மாதிரி தயாரிப்புகளை தயாரித்து/வாங்கி உங்கள் நண்பர்கள் மற்றும் ஆரம்ப வாடிக்கையாளர்களிடம் மாதிரி கருத்து (User Feedback) பெறுங்கள்.

---

### 🛠️ கட்டம் 2: தொழில்நுட்ப தளம் & MVP Storefront (Month 2)
• **Store Setup**: Shopify அல்லது WooCommerce மூலம் நவீன மொபைல்-ஃப்ரெண்ட்லி ஆன்லைன் ஸ்டோரை தொடங்குங்கள்.
• **Payment Gateway**: Razorpay அல்லது Cashfree இணைத்து UPI, கார்டுகள், Net Banking மூலம் பணம் பெறும் வசதியை ஏற்படுத்துங்கள்.
• **Catalog & Visuals**: உயர்தர படங்கள், தயாரிப்பு விவரக்குறிப்புகள் (Specifications), வீடியோ ரீல்கள் மற்றும் தெளிவான வருவாய்/ரீஃபண்ட் கொள்கைகளை அமையுங்கள்.

---

### ⚖️ கட்டம் 3: சட்டப்பூர்வ பதிவுகள் & அரசாங்க அங்கீகாரம் (Month 2 - 3)
• **Business Entity**: பிரைவேட் லிமிடெட் (Pvt Ltd) அல்லது LLP அல்லது ஆரம்ப கட்டத்தில் Proprietorship பதிவு செய்யுங்கள்.
• **GST & MSME / Udyam**: ஜிஎஸ்டி மற்றும் இலவச மத்திய அரசு உதயம் பதிவு (Udyam MSME) பெறுங்கள்.
• **DPIIT Startup India**: ஸ்டார்ட்அப் இந்தியா இணையதளத்தில் பதிவு செய்து வரி விலக்கு மற்றும் அரசாங்க சலுகைகளை அணுகுங்கள்.
• **Trademark (IPR)**: உங்கள் பிராண்ட் பெயரைப் பாதுகாக்க டிரேட்மார்க் பதிவு செய்யுங்கள்.

---

### 📦 கட்டம் 4: விநியோகம், பேக்கேஜிங் & லாஜிஸ்டிக்ஸ் (Month 3)
• **Logistics Aggregator**: Shiprocket, Delhivery, Pickrr போன்ற கூரியர் தளங்களுடன் இணைந்து நாடு முழுவதும் டெலிவரி ஏற்பாடு செய்யுங்கள்.
• **Attractive Packaging**: சுற்றுச்சூழல் நட்பான, பிராண்ட் லோகோவுடன் கூடிய பாதுகாப்பான பேக்கேஜிங் வடிவமையுங்கள்.
• **RTO Reduction Strategy**: COD ஆர்டர்களுக்கு வாட்ஸ்அப் மூலம் உறுதிப்படுத்தல் (WhatsApp OTP verification) செய்து ரிட்டர்ன்களை (RTO) 15%க்கு கீழ் குறையுங்கள்.

---

### 🚀 கட்டம் 5: மார்க்கெட்டிங் & வாடிக்கையாளர் ஈர்ப்பு (Month 4 - 5)
• **Social Media & Influencer Outreach**: Instagram Reels, YouTube Shorts மற்றும் மைக்ரோ இன்ஃப்ளூயன்ஸர்கள் மூலம் தயாரிப்பு பயன்பாட்டை காட்டுங்கள்.
• **Performance Ads**: Meta (Instagram/Facebook) Ads & Google Search Ads மூலம் முதல் 100 கட்டண ஆர்டர்களை பெறுங்கள்.
• **WhatsApp CRM**: கார்ட் டிராப்-ஆஃப் (Abandoned Cart) செய்தவர்களுக்கு வாட்ஸ்அப் மூலம் சலுகை குறியீடு (Discount Coupon) அனுப்பி ஆர்டர்களை மாற்றுங்கள்.

---

### 📈 கட்டம் 6: நிதி திரட்டுதல், வளர்ச்சி & விரிவாக்கம் (Month 6+)
• **Government Grants & Schemes**: SISFS (Startup India Seed Fund - ₹20 லட்சம் வரை மானியம்), TANSEED (தமிழ்நாடு மானியம் - ₹10-15 லட்சம்) ஆகியவற்றிற்கு விண்ணப்பியுங்கள்.
• **Retention & Repeat Orders**: லாயல்டி தள்ளுபடிகள் மற்றும் புதிய தயாரிப்பு வகைகளை அறிமுகப்படுத்தி வாடிக்கையாளர் வாழ்நாள் மதிப்பை (LTV) உயர்த்துங்கள்.
• **Offline / B2B Tie-ups**: ரீடெய்ல் கடைகள் மற்றும் கார்ப்பரேட் கிஃப்டிங் நிறுவனங்களுடன் கூட்டு ஒப்பந்தம் செய்யுங்கள்.

---

📌 **இந்த வாரத்திற்கான உடனடி 3 முக்கிய பணிகள்:**
1. உங்கள் முக்கிய 3 முதன்மை தயாரிப்புகளின் விலை மற்றும் லாப விகிதத்தை (Unit Economics) முடிவு செய்யுங்கள்.
2. மாதிரி Shopify ஸ்டோர் அல்லது இன்ஸ்டாகிராம் பிசினஸ் பக்கத்தை தொடங்குங்கள்.
3. நமது தளத்தில் உள்ள **Roadmap** மெனுவிற்கு சென்று உங்கள் இலக்குகளை டிராக்கிங் செய்யத் தொடங்குங்கள்! 🎯`;
    }

    if (lang === 'tanglish') {
      return `🗺️ **${startupName} - E-Commerce Startup Complete 6-Phase Execution Roadmap**

💡 *Oru successful e-commerce & D2C brand build panna step-by-step clear strategy roadmap:*

---

### 🎯 Phase 1: Idea Validation & Niche Selection (Month 1)
• **Niche & High-Margin Products**: Minimum 40-60% gross margin irukura products-ah choose pannu. Fast-moving & repeat purchase items prioritize pannu.
• **Competitor Breakdown**: Amazon, Meesho, and Instagram competitors oda pricing, packaging, and negative reviews analyze pannu.
• **Sample Testing**: 10-15 sample pieces ready panni initial customers kitta real feedback collect pannu.

---

### 🛠️ Phase 2: MVP Storefront & Tech Setup (Month 2)
• **Online Store**: Shopify or WooCommerce use panni mobile-optimized fast store setup pannu.
• **Payment Gateway**: Razorpay / Cashfree integrate panni UPI, Cards, NetBanking direct payment activate pannu.
• **Product Photography**: Clean white-background photos and aesthetic lifestyle video reels ready pannu.

---

### ⚖️ Phase 3: Legal, GST & DPIIT Registration (Month 2 - 3)
• **Company Registration**: Pvt Ltd, LLP, or initial phase-ku Sole Proprietorship / GST eduthuko.
• **Udyam MSME**: Free government MSME certificate apply pannu.
• **DPIIT Startup India**: Startup India portal-la register panni tax benefits and seed fund eligibility unlock pannu.
• **Brand Trademark**: Brand name copy aagama irukka Trademark (IPR) file pannu.

---

### 📦 Phase 4: Sourcing, Packaging & Logistics (Month 3)
• **Courier Aggregators**: Shiprocket, Delhivery or Pickrr kooda tie-up panni all-India shipping setup pannu.
• **Custom Packaging**: Un brand logo potta eco-friendly aesthetic box & thank you card design pannu.
• **RTO Management**: COD orders-ku WhatsApp confirmation setup panni Return to Origin (RTO) loss-ah 15% kulla maintain pannu.

---

### 🚀 Phase 5: GTM & Customer Acquisition (Month 4 - 5)
• **Meta Performance Ads**: Instagram Reels ads run panni targeted buyers-ku reach pannu. Initial target: First 100 paying customers!
• **Micro-Influencer Seeding**: 10-20 niche creators-ku free PR hampers anuppi organic video reviews create pannu.
• **WhatsApp Cart Recovery**: Abandoned checkout panna users-ku automated WhatsApp coupon send panni conversion increase pannu.

---

### 📈 Phase 6: Seed Funding, Scaling & Retention (Month 6+)
• **Government Seed Grants**: SISFS (Startup India Seed Fund Scheme - ₹20 Lakhs varai grant) & TANSEED (₹10-15 Lakhs grant)-ku apply pannu.
• **Customer Retention**: Repeat buyers-ku loyalty discounts kuduthu Customer Lifetime Value (LTV) boost pannu.
• **Marketplace Expansion**: Amazon Brand Registry & Flipkart-la brand expand pannu.

---

📌 **Immediate Action Steps for This Week:**
1. Top 3 flagship products-oda cost per unit & profit margin calculate pannu.
2. Instagram business account & basic online catalog ready pannu.
3. SRH portal-la **Roadmap** page open panni task milestones track panna start pannu! 🚀`;
    }

    // Default English
    return `🗺️ **${startupName} - Comprehensive 6-Phase E-Commerce Startup Execution Roadmap**

💡 *A structured, step-by-step masterplan to build, launch, and scale a profitable e-commerce / D2C brand:*

---

### 🎯 Phase 1: Niche Discovery, Unit Economics & Market Validation (Month 1)
• **Niche & Product Strategy**: Identify a focused category with at least **40% to 60% gross profit margin** to absorb advertising and shipping costs.
• **Competitor Matrix**: Audit top direct-to-consumer and marketplace competitors across pricing, product variants, packaging, and unboxing reviews.
• **Sample Testing**: Produce or source a small pilot batch of 10–25 units to validate build quality, packaging durability, and initial consumer delight.

---

### 🛠️ Phase 2: MVP Storefront & Technical Architecture (Month 2)
• **E-Commerce Storefront**: Build a high-converting, mobile-first store using Shopify or WooCommerce with optimized checkout flows.
• **Payment Infrastructure**: Integrate verified payment gateways (Razorpay / Cashfree / Stripe) supporting 1-click UPI, credit/debit cards, and EMI.
• **Product Merchandising**: High-resolution lifestyle photography, clear size/material guides, trust badges, and transparent return & exchange policies.

---

### ⚖️ Phase 3: Legal Structuring, GST & Startup India Recognition (Month 2 - 3)
• **Entity Incorporation**: Register as a Private Limited Company (recommended for fundraising) or LLP / Sole Proprietorship.
• **GST & MSME Udyam Registration**: Obtain state GSTIN and Central Government Udyam MSME certification.
• **DPIIT Startup India Certification**: Apply for official recognition to unlock government seed grants, patent rebates, and tax exemptions under Section 80-IAC.
• **Trademark Filing**: Protect your brand name, logo, and identity under Class 35 and product-relevant Trademark classes.

---

### 📦 Phase 4: Supply Chain, Logistics & RTO Optimization (Month 3)
• **3PL Logistics Aggregators**: Onboard platforms like Shiprocket, Delhivery, or Pickrr for multi-courier coverage across 26,000+ Indian pincodes.
• **Branded Unboxing**: Invest in sturdy, tamper-evident, eco-friendly custom packaging with personalized thank-you inserts.
• **RTO & COD Verification**: Implement automated WhatsApp OTP confirmation for Cash on Delivery (COD) orders to maintain Return-to-Origin (RTO) below 15%.

---

### 🚀 Phase 5: Go-to-Market Launch & Performance Marketing (Month 4 - 5)
• **Performance Advertising**: Launch Meta (Instagram & Facebook) Reels campaigns targeting high-intent lookalike audiences. Aim for your first 100 paying customers!
• **Micro-Influencer Seeding**: Partner with 15–20 micro-creators in your niche for authentic unboxing reviews and social proof.
• **WhatsApp CRM & Abandoned Cart Recovery**: Set up automated sequences recovering 15–25% of abandoned checkout carts.

---

### 📈 Phase 6: Seed Grants, Scale & Retention (Month 6+)
• **Government Seed Grants**: Apply for **SISFS (Startup India Seed Fund Scheme)** for up to ₹20 Lakhs non-dilutive grant or ₹50 Lakhs debt, and **TANSEED** (₹10–15 Lakhs).
• **Customer Lifetime Value (LTV)**: Launch subscription bundles, tiered loyalty points, and cross-sell recommendations to drive 30%+ repeat purchase rates.
• **Omnichannel Expansion**: Expand to Amazon Brand Registry, quick commerce (Blinkit/Zepto), and select retail pop-ups.

---

📌 **Immediate Action Items for This Week:**
1. Finalize your top 3 flagship SKU unit economics (Production Cost + Packaging + Shipping + Target CPA).
2. Set up your official Instagram business handle and build the prototype product catalog.
3. Visit the **Roadmap** tab in the navigation bar to track these milestones live and mark completed tasks! 🎯`;
  }

  if (domain === 'agritech') {
    return `🗺️ **${startupName} - AgriTech & Farm Resource Startup Execution Roadmap (6 Phases)**

### 🎯 Phase 1: Ground Problem Validation & FPO Alignment (Month 1)
• Conduct interviews with 30+ local farmers and 2 Farmer Producer Organizations (FPOs) to assess equipment downtime, rental demand, and pricing willingness.
• Map seasonal crop cycles and peak machinery demand windows.

### 🛠️ Phase 2: MVP Booking & Sharing Workflow (Month 2)
• Build a multilingual, lightweight mobile web/app interface supporting voice search, regional languages, and offline-capable booking.
• Onboard 10 equipment owners (tractors, harvesters, drone sprayers) in a 20 km pilot cluster.

### ⚖️ Phase 3: Legal, MSME & DPIIT Recognition (Month 2 - 3)
• Incorporate Private Limited entity and apply for DPIIT Startup India recognition.
• Register for central/state agricultural innovation schemes and NABARD incubator support.

### 🚜 Phase 4: Cluster Operations & Village Champions (Month 3 - 4)
• Appoint local village coordinators ("Gram Mitra") for equipment inspection, operator training, and dispute resolution.
• Partner with local rural banks and CSC (Common Service Centers) for cash/UPI payments.

### 🚀 Phase 5: Pilot Rollout & Farmer Acquisition (Month 4 - 5)
• Execute live demonstration days at village panchayats and farmer melas.
• Offer first-hour subsidized rental to build trust and gather video testimonials.

### 📈 Phase 6: Scaling, SISFS & Agri-Infra Grants (Month 6+)
• Apply for the **Agriculture Infrastructure Fund (AIF)**, **SISFS** grant (up to ₹20L), and **RKVY-RAFTAAR** grants.
• Expand to drone spraying and soil testing services for recurring revenue.

📌 **Immediate Next Steps**: Define your pilot village cluster and track milestones in the **Roadmap** section! 🌾`;
  }

  if (domain === 'saas') {
    return `🗺️ **${startupName} - B2B SaaS Startup Execution Roadmap (6 Phases)**

### 🎯 Phase 1: ICP & Problem Discovery (Month 1)
• Interview 25 potential B2B target buyers (CTOs, Operations Leads, or Founders) to validate high-severity pain points.
• Establish target pricing tiers (e.g., Starter $49/mo, Growth $199/mo, Enterprise Custom).

### 🛠️ Phase 2: MVP Development & Analytics (Month 2)
• Build core functional product focusing only on the primary workflow that delivers 10x value over existing spreadsheets or legacy software.
• Integrate analytics (PostHog/Mixpanel) and customer feedback loops.

### ⚖️ Phase 3: Incorporation & Cloud Credits (Month 2 - 3)
• Form Private Limited or US Delaware C-Corp (if targeting global enterprise buyers).
• Claim up to $25,000 in AWS Activate or Google Cloud for Startups infrastructure credits.

### 🚀 Phase 4: Closed Beta with Design Partners (Month 3 - 4)
• Onboard 5–10 active design partner companies for free/discounted access in exchange for weekly feedback.
• Achieve 70%+ weekly active retention before open launch.

### 📢 Phase 5: Public Launch & Product-Led Growth (Month 4 - 5)
• Launch on Product Hunt, LinkedIn, specialized Discord/Slack communities, and developer forums.
• Implement automated self-serve free trial with frictionless onboarding.

### 📈 Phase 6: Seed Round & Scale (Month 6+)
• Prepare investor data room (MRR, Churn rate, Net Dollar Retention, CAC:LTV).
• Apply for SISFS, angel syndicates, and seed venture accelerators.

📌 **Immediate Action**: Define your ICP and begin tracking development stages on the **Roadmap** tracker tab! 💻`;
  }

  // General Startup Roadmap
  return `🗺️ **${startupName} - Comprehensive 6-Phase Startup Execution Roadmap**

### 🎯 Phase 1: Problem-Solution Fit & User Research (Month 1)
• Conduct 25+ structured customer interviews to validate problem frequency, severity, and willingness to pay.
• Create a Lean Canvas highlighting your unique value proposition (UVP).

### 🛠️ Phase 2: MVP Build & Feedback Loops (Month 2)
• Develop a lean Minimum Viable Product with essential core features only.
• Establish a rapid customer feedback channel via WhatsApp, Discord, or integrated support.

### ⚖️ Phase 3: Legal Structuring & Government Recognition (Month 2 - 3)
• Register business entity (Pvt Ltd / LLP) and obtain GST and MSME Udyam registration.
• Apply for **DPIIT Startup India Recognition** to access tax incentives and government seed funds.

### 📢 Phase 4: Pilot Launch & First 50 Paying Customers (Month 3 - 4)
• Launch targeted digital campaigns, direct founder outreach, and community engagement.
• Measure customer acquisition cost (CAC) and customer satisfaction scores (NPS).

### 💰 Phase 5: Non-Dilutive Funding & Grant Acquisition (Month 4 - 5)
• Apply for **Startup India Seed Fund Scheme (SISFS)** for up to ₹20 Lakhs grant support.
• Apply for state startup grants (e.g. TANSEED, K-TECH) and incubators.

### 📈 Phase 6: Scaling & Repeatable Growth (Month 6+)
• Optimize retention funnels, expand distribution channels, and scale unit economics.
• Connect with verified domain mentors for strategic guidance and investor introductions.

📌 **Next Step**: Head over to the **Roadmap** page in the navigation bar to mark tasks and track your progress in real-time! 🚀`;
}

function generateSmartFallbackReply(userMessage, founderContext = {}, dbResources = [], mentors = [], lang = 'auto') {
  let effectiveLang = lang;
  if (!effectiveLang || effectiveLang === 'auto') {
    if (/[\u0B80-\u0BFF]/.test(userMessage)) {
      effectiveLang = 'ta';
    } else if (/\b(venum|irukku|irukka|irukinga|pannanum|panradhu|enna|epdi|eppadi|solli|solren|sollu|sollunga|tha|kudunga|romba|panren|vachi|illa|aana|kooda|engalukku|en|enakku|ennaku|mudiyum|theriyum|panna|pannalam|nalla|oru|idhu|adhu|thanglish|tamil|bro|pannu|mattum|theva|pesu|pesanum|keta|kettalum|reply|panni|la|nu|da)\b/i.test(userMessage)) {
      effectiveLang = 'tanglish';
    } else {
      effectiveLang = 'en';
    }
  }

  const domain = extractDomain(userMessage);

  if (isRoadmapQuery(userMessage)) {
    return generateRoadmapText(domain, effectiveLang, founderContext, dbResources, mentors);
  }

  // Domain-specific idea advisory
  if (domain === 'ecommerce') {
    if (lang === 'ta') {
      return `💡 **ஈ-காமர்ஸ் & ஆன்லைன் வணிக யோசனை பகுப்பாய்வு**

உங்கள் ஈ-காமர்ஸ் யோசனை சிறந்த சந்தை வாய்ப்புகளைக் கொண்டுள்ளது! இதனை வெற்றிகரமான ஸ்டார்ட்அப்பாக மாற்ற முக்கிய ஆலோசனைகள்:

🎯 **இலக்கு வாடிக்கையாளர்கள் (Target Customers):**
• சமூக ஊடகங்களில் தனித்துவமான தயாரிப்புகளை தேடும் இளைய தலைமுறையினர்.
• பரிசுகள் மற்றும் விசேஷங்களுக்கு பிரத்யேக ஆர்டர்களை விரும்பும் குடும்பங்கள்.

💰 **வருவாய் வழிகள் & விலை நிர்ணயம் (Pricing Model):**
• தயாரிப்பு செலவு + உழைப்பு + பேக்கேஜிங் + குறைந்தபட்சம் 45-50% லாப வரம்பு (Profit Margin).
• தனிப்பயனாக்கப்பட்ட (Customized) மற்றும் பரிசு காம்போ பேக்குகளுக்கு பிரீமியம் கட்டணம்.

✨ **தனித்துவ அம்சங்கள் (USP Improvements):**
• அழகிய பிராண்டட் பேக்கேஜிங் மற்றும் நன்றியுரை கார்டுகள்.
• இன்ஸ்டாகிராம் ரீல்கள் மூலம் தயாரிப்பு உருவாக்கும் நேரடி வீடியோக்களை வெளியிடுதல்.
• வாட்ஸ்அப் மூலம் உடனடி வாடிக்கையாளர் ஆதரவு மற்றும் ஆர்டர் டிராக்கிங்.

📌 **அடுத்த கட்ட திட்டம் (Action Steps):**
1. முதல் 5 தயாரிப்புகளின் விலைப் பட்டியலை முடிவு செய்யுங்கள்.
2. இன்ஸ்டாகிராம் அல்லது Shopify பக்கத்தை தொடங்குங்கள்.
3. முழுமையான 6-Phase வழிகாட்டியை பெற "generate roadmap" என்று கேட்கலாம்! 🚀`;
    }

    if (lang === 'tanglish') {
      return `💡 **E-Commerce & Online Business Idea Strategic Analysis**

Unoda e-commerce startup idea-ku market-la nalla potential irukku! Idhai strong business-ah convert panna tips:

🎯 **Target Customers:**
• Instagram & online-la aesthetic, unique products thedura youngsters & gift buyers.
• Custom personalized orders & bulk return gift buyers.

💰 **Pricing & Profitability:**
• Raw material + Making time + Packaging + Courier cost calculate panni minimum **45-50% gross margin** vekkanum.
• Custom name-printed items & festival gift sets-ku premium pricing charge pannalam.

✨ **Strong USP & Growth Hacks:**
• Premium unboxing experience with aesthetic packaging & personalized notes.
• Instagram Reels & Behind-The-Scenes making videos regular-ah post pannu.
• WhatsApp Business catalog & automated quick checkout link setup pannu.

📌 **Immediate Next Steps:**
1. Top 3-5 best-selling products finalize pannu.
2. Instagram business profile & sample photos catalog ready pannu.
3. Full step-by-step 6-phase plan venumna "generate a roadmap" nu type pannu! 🚀`;
    }

    return `💡 **E-Commerce & D2C Business Strategic Analysis**

Your e-commerce venture has strong market potential! Here is how you can position and scale it:

🎯 **Target Customer Segments:**
• Modern lifestyle and direct-to-consumer buyers looking for curated, authentic products.
• Gifting, festive, and personalized custom-order seekers on social media.

💰 **Monetization & Unit Economics:**
• Ensure a minimum **45% to 60% gross profit margin** on all SKUs to comfortably cover advertising and delivery costs.
• Introduce bundled gift hampers and customized personalization add-ons for high average order value (AOV).

✨ **Key Differentiators (USP):**
• Aesthetic branded unboxing experience with tamper-evident packaging.
• Short-form video storytelling (Instagram Reels, TikTok/Shorts) showing the craft, quality, and durability.
• Direct WhatsApp checkout integration to reduce friction and eliminate cart drop-offs.

📌 **Next Action Steps:**
1. Calculate unit economics for your top 3 product lines.
2. Set up your digital storefront (Shopify / Instagram shop).
3. Type **"generate a roadmap for e-commerce startup"** to get a complete 6-phase execution roadmap! 🚀`;
  }

  // General fallback
  if (lang === 'ta') {
    return `வணக்கம்! உங்கள் ஸ்டார்ட்அப் யோசனை மற்றும் வளர்ச்சித் திட்டத்தை வழிநடத்த நான் தயாராக உள்ளேன்.

💡 **என்னிடம் நீங்கள் கேட்கக்கூடியவை:**
• 🗺️ **"Generate a roadmap for my startup"** - 6 கட்ட விரிவான செயல்முறை திட்டம்.
• 💰 **"Funding schemes for idea stage"** - SISFS, TANSEED மற்றும் அரசு மானியங்கள்.
• 👨‍🏫 **"Find domain mentors"** - துறைசார் ஆலோசகர்களை கண்டறிய.
• ⚖️ **"DPIIT registration guide"** - ஸ்டார்ட்அப் இந்தியா சட்டப்பூர்வ வழிகாட்டுதல்கள்.

உங்கள் ஸ்டார்ட்அப் தயாரிப்பு அல்லது சந்தை விவரங்களை பகிருங்கள்! 🚀`;
  }

  if (lang === 'tanglish') {
    return `Vanakkam! Unoda startup idea-va analyze panni step-by-step scale panna naan ready!

💡 **Nee enkitta direct-ah kekka mudiyum:**
• 🗺️ **"Generate a roadmap for e-commerce startup"** - 6-phase execution roadmap.
• 💰 **"Funding schemes and seed grants"** - SISFS, TANSEED grants details.
• 👨‍🏫 **"Recommend mentors for marketing"** - Domain expert mentors guidance.
• 📊 **"Analyze my startup readiness"** - Audit bottlenecks before investment.

Un startup domain and current progress pathi sollu bro! 🚀`;
  }

  return `Hello! I'm your AI Startup Advisor and Virtual Co-Founder.

💡 **You can ask me to:**
• 🗺️ **"Generate a roadmap for e-commerce startup"** — Full 6-phase execution and milestone roadmap.
• 💰 **"Funding schemes for early stage"** — Discover SISFS, TANSEED, and non-dilutive government grants.
• 👨‍🏫 **"Recommend domain mentors"** — Connect with verified industry leaders.
• 📊 **"Analyze startup readiness"** — Audit product, market, legal, and financial dimensions.

Tell me more about your startup concept or current goal! 🚀`;
}

module.exports = {
  extractDomain,
  isRoadmapQuery,
  generateRoadmapText,
  generateSmartFallbackReply
};
