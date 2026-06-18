# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: product-catalog.spec.ts >> Product Catalog E2E Tests >> should display products with valid data structure
- Location: e2e/product-catalog.spec.ts:24:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="product-card"]').first() to be visible

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "About Us" [ref=e7] [cursor=pointer]:
            - /url: /about-us
          - link "Offers" [ref=e8] [cursor=pointer]:
            - /url: /offers
          - link "Returns & Refunds" [ref=e9] [cursor=pointer]:
            - /url: /return-policy
          - link "Contact Us" [ref=e10] [cursor=pointer]:
            - /url: /contact-us
        - generic [ref=e11]:
          - link "Instagram" [ref=e12] [cursor=pointer]:
            - /url: https://www.instagram.com/mymedevices/
            - img "Instagram" [ref=e13]
          - link "Facebook" [ref=e15] [cursor=pointer]:
            - /url: https://www.facebook.com/profile.php?id=61581546818170
            - img "Facebook" [ref=e16]
          - link "X" [ref=e18] [cursor=pointer]:
            - /url: https://twitter.com/mymeddevicesltd
            - img "X" [ref=e19]
          - link "TikTok" [ref=e21] [cursor=pointer]:
            - /url: https://vm.tiktok.com/ZMA3sMq5S/
            - img "TikTok" [ref=e22]
          - link "Whatsapp" [ref=e24] [cursor=pointer]:
            - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
            - img "WhatsApp" [ref=e25]
          - link "LinkedIn" [ref=e27] [cursor=pointer]:
            - /url: https://www.linkedin.com/company/my-med-device-ltd/
            - img "LinkedIn" [ref=e28]
          - link "YouTube" [ref=e30] [cursor=pointer]:
            - /url: https://www.youtube.com/@mymeddevices
            - img "YouTube" [ref=e31]
          - button "Toggle theme" [ref=e33]:
            - img [ref=e34]
      - generic [ref=e40]:
        - generic [ref=e41]:
          - link "MyMedDevices Logo" [ref=e42] [cursor=pointer]:
            - /url: /
            - img "MyMedDevices Logo" [ref=e43]
          - link "Call us +254 707 757 088" [ref=e44] [cursor=pointer]:
            - /url: tel:+254734585958
            - img [ref=e45]
            - generic [ref=e47]:
              - paragraph [ref=e48]: Call us
              - paragraph [ref=e49]: +254 707 757 088
        - generic [ref=e52]:
          - textbox "Search for Medicines and Health Products" [ref=e53]
          - button [ref=e55]:
            - img [ref=e56]
        - generic [ref=e60]:
          - generic [ref=e61] [cursor=pointer]:
            - img [ref=e62]
            - generic [ref=e69]: Compare
          - generic [ref=e70] [cursor=pointer]:
            - img [ref=e71]
            - generic [ref=e73]: Wishlist
          - generic [ref=e74] [cursor=pointer]:
            - img [ref=e75]
            - generic [ref=e79]: Cart
          - generic [ref=e80] [cursor=pointer]:
            - img [ref=e81]
            - generic [ref=e84]: Login
      - navigation "Main" [ref=e88]:
        - list [ref=e90]:
          - listitem [ref=e91]:
            - button "Shop by Category" [ref=e92]:
              - text: Shop by Category
              - img [ref=e93]
          - listitem [ref=e95]:
            - button "Featured Products" [ref=e96]:
              - text: Featured Products
              - img [ref=e97]
          - listitem [ref=e99]:
            - button "New Arrivals" [ref=e100]:
              - text: New Arrivals
              - img [ref=e101]
          - listitem [ref=e103]:
            - link "Shop" [ref=e104] [cursor=pointer]:
              - /url: /products
    - navigation "breadcrumb" [ref=e106]:
      - list [ref=e107]:
        - listitem [ref=e108]:
          - link "Home" [ref=e109] [cursor=pointer]:
            - /url: /
            - paragraph [ref=e110]: Home
        - listitem [ref=e111]:
          - generic [ref=e112]: /
          - link "Products" [ref=e113] [cursor=pointer]:
            - /url: /products
            - paragraph [ref=e114]: Products
    - generic [ref=e116]:
      - heading "All Products" [level=1] [ref=e118]
      - generic [ref=e119]:
        - complementary [ref=e120]:
          - complementary [ref=e121]:
            - generic [ref=e122]:
              - heading "Categories" [level=3] [ref=e123]
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - radio "Monitoring Devices" [ref=e126]
                  - generic [ref=e127] [cursor=pointer]: Monitoring Devices
                - generic [ref=e128]:
                  - radio "Mobility & Rehabilitation Aids" [ref=e129]
                  - generic [ref=e130] [cursor=pointer]: Mobility & Rehabilitation Aids
                - generic [ref=e131]:
                  - radio "Respiratory Equipment" [ref=e132]
                  - generic [ref=e133] [cursor=pointer]: Respiratory Equipment
                - generic [ref=e134]:
                  - radio "Diagnostic Devices" [ref=e135]
                  - generic [ref=e136] [cursor=pointer]: Diagnostic Devices
                - generic [ref=e137]:
                  - radio "Home Care Equipment" [ref=e138]
                  - generic [ref=e139] [cursor=pointer]: Home Care Equipment
                - generic [ref=e140]:
                  - radio "Orthotics & Braces" [ref=e141]
                  - generic [ref=e142] [cursor=pointer]: Orthotics & Braces
            - generic [ref=e144]:
              - generic [ref=e145]: Price Range
              - application [ref=e149]
              - generic [ref=e156]:
                - slider "Minimum" [ref=e160]
                - slider "Maximum" [ref=e162]
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - generic [ref=e165]: KSH
                  - spinbutton [ref=e166]: "0"
                - generic [ref=e167]: —
                - generic [ref=e168]:
                  - generic [ref=e169]: KSH
                  - spinbutton [ref=e170]: "10000"
            - generic [ref=e172]:
              - generic [ref=e173]:
                - heading "More Filters" [level=4] [ref=e174]
                - generic [ref=e175]:
                  - generic [ref=e176] [cursor=pointer]:
                    - checkbox "On sale only" [ref=e177]
                    - generic [ref=e178]: On sale only
                  - generic [ref=e179]:
                    - generic [ref=e180]: Stock status
                    - combobox [ref=e181]:
                      - option "Any"
                      - option "In stock" [selected]
                      - option "Out of stock"
                  - generic [ref=e182]:
                    - generic [ref=e183]: Brand
                    - textbox "Filter by brand name..." [ref=e184]
                  - generic [ref=e185]:
                    - generic [ref=e186]: Minimum rating
                    - combobox [ref=e187]:
                      - option "Any" [selected]
                      - option "1 star & up"
                      - option "2 stars & up"
                      - option "3 stars & up"
                      - option "4 stars & up"
                      - option "5 stars"
              - button "Clear All Filters" [ref=e189]
        - main [ref=e190]:
          - generic [ref=e192]:
            - generic [ref=e193]:
              - heading "Products" [level=1] [ref=e194]
              - generic [ref=e195]: 14 results
            - button "Sort by" [ref=e197]:
              - text: Sort by
              - img
          - generic [ref=e199]:
            - generic [ref=e201]:
              - generic [ref=e202]:
                - img "Yuwell YX305 Fingertip Pulse Oximeter" [ref=e203]
                - generic [ref=e205]: Sale
                - generic [ref=e206]:
                  - generic [ref=e207]: ★
                  - generic [ref=e208]: "4.5"
                  - generic [ref=e209]: (24)
                - generic [ref=e210]:
                  - button "Add to wishlist" [ref=e211]:
                    - img
                  - button "Share" [ref=e212]:
                    - img
                  - button "View related products" [ref=e213]:
                    - img
              - generic [ref=e214]:
                - generic [ref=e215] [cursor=pointer]:
                  - paragraph [ref=e216]: Monitoring Devices
                  - heading "Yuwell YX305 Fingertip Pulse Oximeter" [level=3] [ref=e217]
                - generic [ref=e218]:
                  - paragraph [ref=e219]: Ksh. 900
                  - generic [ref=e220]: Ksh. 1,100
                - button "Add to cart" [ref=e224]:
                  - img
                  - text: Add to cart
            - generic [ref=e226]:
              - generic [ref=e227]:
                - img "Contec CMS50D Fingertip Pulse Oximeter" [ref=e228]
                - generic [ref=e230]: Sale
                - generic [ref=e231]:
                  - generic [ref=e232]: ★
                  - generic [ref=e233]: "4.5"
                  - generic [ref=e234]: (24)
                - generic [ref=e235]:
                  - button "Add to wishlist" [ref=e236]:
                    - img
                  - button "Share" [ref=e237]:
                    - img
                  - button "View related products" [ref=e238]:
                    - img
              - generic [ref=e239]:
                - generic [ref=e240] [cursor=pointer]:
                  - paragraph [ref=e241]: Monitoring Devices
                  - heading "Contec CMS50D Fingertip Pulse Oximeter" [level=3] [ref=e242]
                - generic [ref=e243]:
                  - paragraph [ref=e244]: Ksh. 1,200
                  - generic [ref=e245]: Ksh. 1,500
                - button "Add to cart" [ref=e249]:
                  - img
                  - text: Add to cart
            - generic [ref=e251]:
              - generic [ref=e252]:
                - img "Yuwell 710 Blood Glucose Testing System" [ref=e253]
                - generic [ref=e255]: Sale
                - generic [ref=e256]:
                  - generic [ref=e257]: ★
                  - generic [ref=e258]: "4.5"
                  - generic [ref=e259]: (24)
                - generic [ref=e260]:
                  - button "Add to wishlist" [ref=e261]:
                    - img
                  - button "Share" [ref=e262]:
                    - img
                  - button "View related products" [ref=e263]:
                    - img
              - generic [ref=e264]:
                - generic [ref=e265] [cursor=pointer]:
                  - paragraph [ref=e266]: Monitoring Devices
                  - heading "Yuwell 710 Blood Glucose Testing System" [level=3] [ref=e267]
                - generic [ref=e268]:
                  - paragraph [ref=e269]: Ksh. 1,800
                  - generic [ref=e270]: Ksh. 2,200
                - button "Add to cart" [ref=e274]:
                  - img
                  - text: Add to cart
            - generic [ref=e276]:
              - generic [ref=e277]:
                - img "Contec GLU10 Blood Glucose Meter with 50 Test Strips" [ref=e278]
                - generic [ref=e280]: Sale
                - generic [ref=e281]:
                  - generic [ref=e282]: ★
                  - generic [ref=e283]: "4.5"
                  - generic [ref=e284]: (24)
                - generic [ref=e285]:
                  - button "Add to wishlist" [ref=e286]:
                    - img
                  - button "Share" [ref=e287]:
                    - img
                  - button "View related products" [ref=e288]:
                    - img
              - generic [ref=e289]:
                - generic [ref=e290] [cursor=pointer]:
                  - paragraph [ref=e291]: Monitoring Devices
                  - heading "Contec GLU10 Blood Glucose Meter with 50 Test Strips" [level=3] [ref=e292]
                - generic [ref=e293]:
                  - paragraph [ref=e294]: Ksh. 2,200
                  - generic [ref=e295]: Ksh. 2,700
                - button "Add to cart" [ref=e299]:
                  - img
                  - text: Add to cart
            - generic [ref=e301]:
              - generic [ref=e302]:
                - img "Beurer FT 90 Non-Contact Infrared Forehead Thermometer" [ref=e303]
                - generic [ref=e305]: Sale
                - generic [ref=e306]:
                  - generic [ref=e307]: ★
                  - generic [ref=e308]: "4.5"
                  - generic [ref=e309]: (24)
                - generic [ref=e310]:
                  - button "Add to wishlist" [ref=e311]:
                    - img
                  - button "Share" [ref=e312]:
                    - img
                  - button "View related products" [ref=e313]:
                    - img
              - generic [ref=e314]:
                - generic [ref=e315] [cursor=pointer]:
                  - paragraph [ref=e316]: Monitoring Devices
                  - heading "Beurer FT 90 Non-Contact Infrared Forehead Thermometer" [level=3] [ref=e317]
                - generic [ref=e318]:
                  - paragraph [ref=e319]: Ksh. 3,200
                  - generic [ref=e320]: Ksh. 3,800
                - button "Add to cart" [ref=e324]:
                  - img
                  - text: Add to cart
            - generic [ref=e326]:
              - generic [ref=e327]:
                - img "Beurer PO 30 Fingertip Pulse Oximeter" [ref=e328]
                - generic [ref=e329]:
                  - generic [ref=e330]: ★
                  - generic [ref=e331]: "4.5"
                  - generic [ref=e332]: (24)
                - generic [ref=e333]:
                  - button "Add to wishlist" [ref=e334]:
                    - img
                  - button "Share" [ref=e335]:
                    - img
                  - button "View related products" [ref=e336]:
                    - img
              - generic [ref=e337]:
                - generic [ref=e338] [cursor=pointer]:
                  - paragraph [ref=e339]: Monitoring Devices
                  - heading "Beurer PO 30 Fingertip Pulse Oximeter" [level=3] [ref=e340]
                - paragraph [ref=e342]: Ksh. 1,600
                - button "Add to cart" [ref=e346]:
                  - img
                  - text: Add to cart
            - generic [ref=e348]:
              - generic [ref=e349]:
                - img "Omron M3 Comfort Automatic Blood Pressure Monitor" [ref=e350]
                - generic [ref=e352]: Sale
                - generic [ref=e353]:
                  - generic [ref=e354]: ★
                  - generic [ref=e355]: "4.5"
                  - generic [ref=e356]: (24)
                - generic [ref=e357]:
                  - button "Add to wishlist" [ref=e358]:
                    - img
                  - button "Share" [ref=e359]:
                    - img
                  - button "View related products" [ref=e360]:
                    - img
              - generic [ref=e361]:
                - generic [ref=e362] [cursor=pointer]:
                  - paragraph [ref=e363]: Monitoring Devices
                  - heading "Omron M3 Comfort Automatic Blood Pressure Monitor" [level=3] [ref=e364]
                - generic [ref=e365]:
                  - paragraph [ref=e366]: Ksh. 4,500
                  - generic [ref=e367]: Ksh. 5,200
                - button "Add to cart" [ref=e371]:
                  - img
                  - text: Add to cart
            - generic [ref=e373]:
              - generic [ref=e374]:
                - img "Omron HGM-112 Blood Glucose Meter" [ref=e375]
                - generic [ref=e376]:
                  - generic [ref=e377]: ★
                  - generic [ref=e378]: "4.5"
                  - generic [ref=e379]: (24)
                - generic [ref=e380]:
                  - button "Add to wishlist" [ref=e381]:
                    - img
                  - button "Share" [ref=e382]:
                    - img
                  - button "View related products" [ref=e383]:
                    - img
              - generic [ref=e384]:
                - generic [ref=e385] [cursor=pointer]:
                  - paragraph [ref=e386]: Monitoring Devices
                  - heading "Omron HGM-112 Blood Glucose Meter" [level=3] [ref=e387]
                - paragraph [ref=e389]: Ksh. 2,900
                - button "Add to cart" [ref=e393]:
                  - img
                  - text: Add to cart
            - generic [ref=e395]:
              - generic [ref=e396]:
                - img "Beurer BC 57 Wrist Blood Pressure Monitor with Bluetooth" [ref=e397]
                - generic [ref=e399]: Sale
                - generic [ref=e400]:
                  - generic [ref=e401]: ★
                  - generic [ref=e402]: "4.5"
                  - generic [ref=e403]: (24)
                - generic [ref=e404]:
                  - button "Add to wishlist" [ref=e405]:
                    - img
                  - button "Share" [ref=e406]:
                    - img
                  - button "View related products" [ref=e407]:
                    - img
              - generic [ref=e408]:
                - generic [ref=e409] [cursor=pointer]:
                  - paragraph [ref=e410]: Monitoring Devices
                  - heading "Beurer BC 57 Wrist Blood Pressure Monitor with Bluetooth" [level=3] [ref=e411]
                - generic [ref=e412]:
                  - paragraph [ref=e413]: Ksh. 5,500
                  - generic [ref=e414]: Ksh. 6,000
                - button "Add to cart" [ref=e418]:
                  - img
                  - text: Add to cart
            - generic [ref=e420]:
              - generic [ref=e421]:
                - img "Beurer BM 55 Upper Arm Blood Pressure Monitor" [ref=e422]
                - generic [ref=e423]:
                  - generic [ref=e424]: ★
                  - generic [ref=e425]: "4.5"
                  - generic [ref=e426]: (24)
                - generic [ref=e427]:
                  - button "Add to wishlist" [ref=e428]:
                    - img
                  - button "Share" [ref=e429]:
                    - img
                  - button "View related products" [ref=e430]:
                    - img
              - generic [ref=e431]:
                - generic [ref=e432] [cursor=pointer]:
                  - paragraph [ref=e433]: Monitoring Devices
                  - heading "Beurer BM 55 Upper Arm Blood Pressure Monitor" [level=3] [ref=e434]
                - paragraph [ref=e436]: Ksh. 3,800
                - button "Add to cart" [ref=e440]:
                  - img
                  - text: Add to cart
            - generic [ref=e442]:
              - generic [ref=e443]:
                - img "Contec CMS60C Wrist Pulse Oximeter with Alarm" [ref=e444]
                - generic [ref=e445]:
                  - generic [ref=e446]: ★
                  - generic [ref=e447]: "4.5"
                  - generic [ref=e448]: (24)
                - generic [ref=e449]:
                  - button "Add to wishlist" [ref=e450]:
                    - img
                  - button "Share" [ref=e451]:
                    - img
                  - button "View related products" [ref=e452]:
                    - img
              - generic [ref=e453]:
                - generic [ref=e454] [cursor=pointer]:
                  - paragraph [ref=e455]: Monitoring Devices
                  - heading "Contec CMS60C Wrist Pulse Oximeter with Alarm" [level=3] [ref=e456]
                - paragraph [ref=e458]: Ksh. 5,800
                - button "Add to cart" [ref=e462]:
                  - img
                  - text: Add to cart
            - generic [ref=e464]:
              - generic [ref=e465]:
                - img "Omron HEM-7156T Wireless Upper Arm Monitor" [ref=e466]
                - generic [ref=e467]:
                  - generic [ref=e468]: ★
                  - generic [ref=e469]: "4.5"
                  - generic [ref=e470]: (24)
                - generic [ref=e471]:
                  - button "Add to wishlist" [ref=e472]:
                    - img
                  - button "Share" [ref=e473]:
                    - img
                  - button "View related products" [ref=e474]:
                    - img
              - generic [ref=e475]:
                - generic [ref=e476] [cursor=pointer]:
                  - paragraph [ref=e477]: Monitoring Devices
                  - heading "Omron HEM-7156T Wireless Upper Arm Monitor" [level=3] [ref=e478]
                - paragraph [ref=e480]: Ksh. 6,200
                - button "Add to cart" [ref=e484]:
                  - img
                  - text: Add to cart
            - generic [ref=e486]:
              - generic [ref=e487]:
                - img "Omron Evolv All-in-One Upper Arm Blood Pressure Monitor" [ref=e488]
                - generic [ref=e490]: Sale
                - generic [ref=e491]:
                  - generic [ref=e492]: ★
                  - generic [ref=e493]: "4.5"
                  - generic [ref=e494]: (24)
                - generic [ref=e495]:
                  - button "Add to wishlist" [ref=e496]:
                    - img
                  - button "Share" [ref=e497]:
                    - img
                  - button "View related products" [ref=e498]:
                    - img
              - generic [ref=e499]:
                - generic [ref=e500] [cursor=pointer]:
                  - paragraph [ref=e501]: Monitoring Devices
                  - heading "Omron Evolv All-in-One Upper Arm Blood Pressure Monitor" [level=3] [ref=e502]
                - generic [ref=e503]:
                  - paragraph [ref=e504]: Ksh. 9,500
                  - generic [ref=e505]: Ksh. 10,500
                - button "Add to cart" [ref=e509]:
                  - img
                  - text: Add to cart
            - generic [ref=e511]:
              - generic [ref=e512]:
                - img "Contec CMS50D+ Wrist Pulse Oximeter with Glucose Function" [ref=e513]
                - generic [ref=e515]: Sale
                - generic [ref=e516]:
                  - generic [ref=e517]: ★
                  - generic [ref=e518]: "4.5"
                  - generic [ref=e519]: (24)
                - generic [ref=e520]:
                  - button "Add to wishlist" [ref=e521]:
                    - img
                  - button "Share" [ref=e522]:
                    - img
                  - button "View related products" [ref=e523]:
                    - img
              - generic [ref=e524]:
                - generic [ref=e525] [cursor=pointer]:
                  - paragraph [ref=e526]: Monitoring Devices
                  - heading "Contec CMS50D+ Wrist Pulse Oximeter with Glucose Function" [level=3] [ref=e527]
                - generic [ref=e528]:
                  - paragraph [ref=e529]: Ksh. 7,800
                  - generic [ref=e530]: Ksh. 8,500
                - button "Add to cart" [ref=e534]:
                  - img
                  - text: Add to cart
    - generic [ref=e536]:
      - generic [ref=e537]:
        - generic [ref=e539]:
          - generic [ref=e540]:
            - img "MyMedDevices Logo" [ref=e542]
            - paragraph [ref=e543]: Your trusted pharmaceutical partner, providing quality health solutions for everyone.
            - generic [ref=e544]:
              - link "Instagram" [ref=e545] [cursor=pointer]:
                - /url: https://www.instagram.com/mymedevices/
                - img "Instagram" [ref=e546]
              - link "Facebook" [ref=e548] [cursor=pointer]:
                - /url: https://www.facebook.com/profile.php?id=61581546818170
                - img "Facebook" [ref=e549]
              - link "X" [ref=e551] [cursor=pointer]:
                - /url: https://twitter.com/mymeddevicesltd
                - img "X" [ref=e552]
              - link "TikTok" [ref=e554] [cursor=pointer]:
                - /url: https://vm.tiktok.com/ZMA3sMq5S/
                - img "TikTok" [ref=e555]
              - link "Whatsapp" [ref=e557] [cursor=pointer]:
                - /url: https://api.whatsapp.com/send?phone=254735239696&text=MyMedDevices%0AHello!%20I'm%20interested%20in%20your%20medical%20devices.%20Can%20you%20help%20me%3F
                - img "WhatsApp" [ref=e558]
              - link "LinkedIn" [ref=e560] [cursor=pointer]:
                - /url: https://www.linkedin.com/company/my-med-device-ltd/
                - img "LinkedIn" [ref=e561]
              - link "YouTube" [ref=e563] [cursor=pointer]:
                - /url: https://www.youtube.com/@mymeddevices
                - img "YouTube" [ref=e564]
          - generic [ref=e566]:
            - generic [ref=e567]:
              - heading "Company" [level=4] [ref=e568]
              - list [ref=e569]:
                - listitem [ref=e570]:
                  - link "About Us" [ref=e571] [cursor=pointer]:
                    - /url: /about-us
                - listitem [ref=e572]:
                  - link "Contact Us" [ref=e573] [cursor=pointer]:
                    - /url: /contact-us
            - generic [ref=e574]:
              - heading "Policies" [level=4] [ref=e575]
              - list [ref=e576]:
                - listitem [ref=e577]:
                  - link "Privacy Policy" [ref=e578] [cursor=pointer]:
                    - /url: /privacy-policy
                - listitem [ref=e579]:
                  - link "Terms & Conditions" [ref=e580] [cursor=pointer]:
                    - /url: /terms-and-conditions
                - listitem [ref=e581]:
                  - link "Shipping Policy" [ref=e582] [cursor=pointer]:
                    - /url: /shipping-policy
                - listitem [ref=e583]:
                  - link "Return Policy" [ref=e584] [cursor=pointer]:
                    - /url: /return-policy
            - generic [ref=e585]:
              - heading "Shop" [level=4] [ref=e586]
              - list [ref=e587]:
                - listitem [ref=e588]:
                  - link "All Products" [ref=e589] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e590]:
                  - link "Offers" [ref=e591] [cursor=pointer]:
                    - /url: /offers
                - listitem [ref=e592]:
                  - link "Best Sellers" [ref=e593] [cursor=pointer]:
                    - /url: /best-sellers
                - listitem [ref=e594]:
                  - link "New Arrivals" [ref=e595] [cursor=pointer]:
                    - /url: /new-arrivals
            - generic [ref=e596]:
              - heading "Quick Links" [level=4] [ref=e597]
              - list [ref=e598]:
                - listitem [ref=e599]:
                  - link "Checkout" [ref=e600] [cursor=pointer]:
                    - /url: /checkout
                - listitem [ref=e601]:
                  - link "My Wishlist" [ref=e602] [cursor=pointer]:
                    - /url: /wishlist
                - listitem [ref=e603]:
                  - link "Compare Products" [ref=e604] [cursor=pointer]:
                    - /url: /compare
        - generic [ref=e607]:
          - generic [ref=e609]:
            - heading "Download Our App" [level=4] [ref=e610]
            - generic [ref=e611]:
              - link "Download on the App Store" [ref=e612] [cursor=pointer]:
                - /url: https://apps.apple.com/
                - img "Download on the App Store" [ref=e613]
              - link "Get it on Google Play" [ref=e614] [cursor=pointer]:
                - /url: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en
                - img "Get it on Google Play" [ref=e615]
          - generic [ref=e616]:
            - heading "Shop on The Go" [level=4] [ref=e617]
            - generic [ref=e618]:
              - generic [ref=e619]:
                - img [ref=e621]
                - generic [ref=e624]:
                  - paragraph [ref=e625]: Email Support
                  - paragraph [ref=e626]: support@mymeddevices.co.ke
              - generic [ref=e627]:
                - img [ref=e629]
                - generic [ref=e631]:
                  - paragraph [ref=e632]: Phone Support
                  - paragraph [ref=e633]: +254 707 757 088
              - generic [ref=e634]:
                - img [ref=e636]
                - generic [ref=e639]:
                  - paragraph [ref=e640]: Customer Service
                  - paragraph [ref=e641]: 24/7 dedicated support
              - generic [ref=e642]:
                - img [ref=e644]
                - generic [ref=e647]:
                  - paragraph [ref=e648]: Head Office
                  - paragraph [ref=e649]: Muchai Drive 47, Ngong RD
      - generic [ref=e650]:
        - paragraph [ref=e651]: © 2026 MyMedDevices Kenya. All Rights Reserved.
        - img "M-Pesa payment" [ref=e654]
    - button "Go to top":
      - img
  - region "Notifications alt+T"
  - button "Chat on WhatsApp" [ref=e655]:
    - img "WhatsApp" [ref=e656]
  - button "Open Next.js Dev Tools" [ref=e662] [cursor=pointer]:
    - img [ref=e663]
  - alert [ref=e666]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Product Catalog E2E Tests', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to the products page before each test
  6   |     await page.goto('/products');
  7   |   });
  8   | 
  9   |   test('should load the products page with product grid', async ({ page }) => {
  10  |     // Check page title
  11  |     await expect(page).toHaveTitle(/All Products/i);
  12  | 
  13  |     // Verify main heading
  14  |     await expect(page.getByRole('heading', { name: 'All Products' })).toBeVisible();
  15  | 
  16  |     // Wait for products to load (check for product cards or loading state)
  17  |     // If using API hooks, we might see loading skeleton first
  18  |     await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 }).catch(() => {
  19  |       // If no product cards, check for empty state or error
  20  |       expect(page.locator('text=/no products/i')).toBeVisible();
  21  |     });
  22  |   });
  23  | 
  24  |   test('should display products with valid data structure', async ({ page }) => {
  25  |     // Wait for products to load
  26  |     const productCards = page.locator('[data-testid="product-card"]').first();
> 27  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
      |                        ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  28  | 
  29  |     // Verify product card has expected elements
  30  |     await expect(productCards.locator('img')).toBeVisible(); // Product image
  31  |     await expect(productCards.locator('[data-testid="product-name"]')).toBeVisible(); // Product name
  32  |     await expect(productCards.locator('[data-testid="product-price"]')).toBeVisible(); // Product price
  33  |   });
  34  | 
  35  |   test('should navigate to featured products page', async ({ page }) => {
  36  |     await page.goto('/featured');
  37  | 
  38  |     // Check page title
  39  |     await expect(page).toHaveTitle(/Featured Products/i);
  40  | 
  41  |     // Verify heading
  42  |     await expect(page.getByRole('heading', { name: 'Featured Products' })).toBeVisible();
  43  | 
  44  |     // Verify products are displayed
  45  |     const productCards = page.locator('[data-testid="product-card"]').first();
  46  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  47  |   });
  48  | 
  49  |   test('should navigate to new arrivals page', async ({ page }) => {
  50  |     await page.goto('/new-arrivals');
  51  | 
  52  |     // Check page title
  53  |     await expect(page).toHaveTitle(/New Arrivals/i);
  54  | 
  55  |     // Verify heading
  56  |     await expect(page.getByRole('heading', { name: 'New Arrivals' })).toBeVisible();
  57  | 
  58  |     // Verify products are displayed
  59  |     const productCards = page.locator('[data-testid="product-card"]').first();
  60  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  61  |   });
  62  | 
  63  |   test('should navigate to best sellers page', async ({ page }) => {
  64  |     await page.goto('/best-sellers');
  65  | 
  66  |     // Check page title
  67  |     await expect(page).toHaveTitle(/Best Sellers/i);
  68  | 
  69  |     // Verify heading
  70  |     await expect(page.getByRole('heading', { name: 'Best Sellers' })).toBeVisible();
  71  | 
  72  |     // Verify products are displayed
  73  |     const productCards = page.locator('[data-testid="product-card"]').first();
  74  |     await productCards.waitFor({ state: 'visible', timeout: 10000 });
  75  |   });
  76  | 
  77  |   test('should navigate to offers/sale page', async ({ page }) => {
  78  |     await page.goto('/offers');
  79  | 
  80  |     // Check page title
  81  |     await expect(page).toHaveTitle(/Offers/i);
  82  | 
  83  |     // Verify heading or section
  84  |     await expect(page.getByRole('heading', { name: /offers/i }).or(page.getByText(/special offers/i))).toBeVisible();
  85  | 
  86  |     // Verify offers are displayed
  87  |     const offerCards = page.locator('[data-testid="offer-card"], [data-testid="product-card"]').first();
  88  |     await offerCards.waitFor({ state: 'visible', timeout: 10000 });
  89  |   });
  90  | 
  91  |   test('should navigate to categories page and show categories', async ({ page }) => {
  92  |     await page.goto('/categories');
  93  | 
  94  |     // Check page title
  95  |     await expect(page).toHaveTitle(/Categories/i);
  96  | 
  97  |     // Verify heading
  98  |     await expect(page.getByRole('heading', { name: /categories/i })).toBeVisible();
  99  | 
  100 |     // Verify category cards are displayed
  101 |     const categoryCards = page.locator('a[href*="/categories/"]').first();
  102 |     await categoryCards.waitFor({ state: 'visible', timeout: 10000 });
  103 |   });
  104 | 
  105 |   test('should navigate to a specific category page', async ({ page }) => {
  106 |     // First go to categories to get a valid category link
  107 |     await page.goto('/categories');
  108 | 
  109 |     // Find a category link
  110 |     const categoryLink = page.locator('a[href*="/categories/"]').first();
  111 |     await expect(categoryLink).toBeVisible();
  112 | 
  113 |     // Get the category name for verification
  114 |     const categoryName = await categoryLink.innerText();
  115 | 
  116 |     // Click and navigate
  117 |     await Promise.all([
  118 |       page.waitForNavigation(),
  119 |       categoryLink.click()
  120 |     ]);
  121 | 
  122 |     // Verify we're on a category page
  123 |     await expect(page).toHaveURL(/\/categories\/[a-z0-9-]+/);
  124 | 
  125 |     // Verify the category heading matches (or is related to) what we clicked
  126 |     const heading = page.locator('h1, h2').first();
  127 |     await expect(heading).toBeVisible();
```