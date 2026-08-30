/**
 * Comprehensive Master Harmonized Tariff Schedule (HTS / Schedule B / HS) Database
 * Covers all commercial cross-border freight commodities across all HS Chapters (1 - 97).
 * Equipped with synonym indexing and fast fuzzy/token query search.
 */

export const HTS_MASTER_DATABASE = [
  // ==========================================
  // SECTION I: LIVE ANIMALS & ANIMAL PRODUCTS (Ch. 01 - 05)
  // ==========================================
  {
    hts_code: "0102.29.4000",
    description: "Live bovine animals (purebred breeding cattle, beef steers, dairy cows)",
    category: "Live Animals (Ch. 01)",
    duty_rate_pct: 0.0,
    unit: "HEAD",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS / CFIA Veterinary",
    is_hazmat: false,
    keywords: "cattle cow bull steer livestock bovine calves breeding animals"
  },
  {
    hts_code: "0103.92.0000",
    description: "Live swine (commercial market pigs & breeding feeder hogs)",
    category: "Live Animals (Ch. 01)",
    duty_rate_pct: 0.0,
    unit: "HEAD",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS / CFIA Veterinary",
    is_hazmat: false,
    keywords: "pigs swine hogs livestock pork breeding animals"
  },
  {
    hts_code: "0201.10.0000",
    description: "Carcasses and half-carcasses of bovine animals, fresh or chilled",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "beef cattle carcasses fresh chilled meat butchered hanging beef"
  },
  {
    hts_code: "0201.20.0400",
    description: "Bovine meat cuts with bone in, fresh or chilled (Ribeye, T-Bone, Short Loin)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "beef bone in steak ribeye tbone primal cuts chilled fresh meat"
  },
  {
    hts_code: "0201.30.5000",
    description: "Fresh or chilled boneless bovine meat (Commercial beef trim, striploin, tenderloin)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "boneless beef ground beef steak fresh chilled tenderloin striploin sirloin"
  },
  {
    hts_code: "0202.30.5000",
    description: "Frozen boneless meat of bovine animals (Commercial boxed beef, frozen combo bins)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "frozen beef boneless frozen meat beef trim bulk beef boxes"
  },
  {
    hts_code: "0203.11.0000",
    description: "Carcasses and half-carcasses of swine, fresh or chilled",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "pork fresh chilled hog carcasses swine meat"
  },
  {
    hts_code: "0203.29.4000",
    description: "Frozen pork cuts and hams (Frozen pork bellies, pork loins, spareribs)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "frozen pork hams pork belly ribs pork loins bacon cuts meat"
  },
  {
    hts_code: "0207.12.0000",
    description: "Meat and edible offal of poultry, whole chickens not cut in pieces, frozen",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "poultry whole chicken frozen broilers roasters meat"
  },
  {
    hts_code: "0207.14.0090",
    description: "Frozen cuts and offal of fowls of species Gallus domesticus (Chicken wings, breasts, thighs)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "chicken breasts chicken wings drumsticks frozen poultry cuts chicken nuggets meat"
  },
  {
    hts_code: "0207.27.0000",
    description: "Frozen cuts and offal of turkeys (Whole frozen turkeys, turkey breasts, drumsticks)",
    category: "Meat & Poultry (Ch. 02)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA Meat Inspection",
    is_hazmat: false,
    keywords: "turkey frozen turkey breast ground turkey poultry Thanksgiving"
  },
  {
    hts_code: "0302.14.0000",
    description: "Fresh or chilled Atlantic salmon and Danube salmon",
    category: "Fish & Seafood (Ch. 03)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA HACCP / CFIA / NOAA Seafood",
    is_hazmat: false,
    keywords: "salmon fresh fish chilled seafood whole salmon fillets"
  },
  {
    hts_code: "0306.17.0000",
    description: "Frozen other shrimps and prawns (Raw IQF, peeled/deveined, shell-on)",
    category: "Fish & Seafood (Ch. 03)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA HACCP / CFIA Seafood",
    is_hazmat: false,
    keywords: "shrimp prawns frozen shrimp seafood crustacean IQF"
  },
  {
    hts_code: "0306.32.0000",
    description: "Live American lobsters (Homarus americanus) in water totes / iced styrofoam boxes",
    category: "Fish & Seafood (Ch. 03)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA HACCP / CFIA / NOAA",
    is_hazmat: false,
    keywords: "live lobster seafood Atlantic lobster fresh shellfish"
  },
  {
    hts_code: "0401.20.4000",
    description: "Fresh fluid whole and 2% milk, not concentrated nor containing added sugar",
    category: "Dairy & Milk (Ch. 04)",
    duty_rate_pct: 0.0,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA NCIMS / CFIA Dairy",
    is_hazmat: false,
    keywords: "milk fluid milk dairy fresh whole milk pasteurized refrigerated"
  },
  {
    hts_code: "0402.10.5000",
    description: "Skim milk powder / non-fat dry milk (NFDM) in 25kg bulk bags",
    category: "Dairy & Milk (Ch. 04)",
    duty_rate_pct: 3.3,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / CFIA",
    is_hazmat: false,
    keywords: "milk powder skim milk powder nonfat dry milk dairy bulk bags"
  },
  {
    hts_code: "0405.10.1000",
    description: "Butter and dairy spreads (Creamery butter, salted & unsalted bulk blocks)",
    category: "Dairy & Butter (Ch. 04)",
    duty_rate_pct: 6.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / CFIA",
    is_hazmat: false,
    keywords: "butter dairy creamery butter salted butter unsalted butter baking"
  },
  {
    hts_code: "0406.90.9500",
    description: "Cheddar, Mozzarella, Gouda and specialty hard/semi-hard cheeses",
    category: "Dairy & Cheese (Ch. 04)",
    duty_rate_pct: 8.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / USDA Veterinary",
    is_hazmat: false,
    keywords: "cheese cheddar mozzarella gouda parmesan dairy shredded cheese"
  },
  {
    hts_code: "0407.21.0000",
    description: "Fresh in-shell eggs of domestic fowls for human consumption (Retail graded cartons)",
    category: "Eggs (Ch. 04)",
    duty_rate_pct: 0.0,
    unit: "DOZ",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / USDA FSIS",
    is_hazmat: false,
    keywords: "eggs shell eggs fresh chicken eggs refrigerated cartons"
  },
  {
    hts_code: "0409.00.0000",
    description: "Natural honey (Raw, clover, wildflower honey in bulk 55-gallon drums & retail jars)",
    category: "Honey (Ch. 04)",
    duty_rate_pct: 1.9,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "honey raw honey clover honey wildflower natural sweetener drums"
  },

  // ==========================================
  // SECTION II: VEGETABLE PRODUCTS & PRODUCE (Ch. 06 - 14)
  // ==========================================
  {
    hts_code: "0602.90.0000",
    description: "Live greenhouse potted plants, trees, shrubs, and nursery stock",
    category: "Nursery & Plants (Ch. 06)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS Phytosanitary / CFIA",
    is_hazmat: false,
    keywords: "plants live plants shrubs nursery trees greenhouse flowers horticulture"
  },
  {
    hts_code: "0701.90.5000",
    description: "Fresh commercial table potatoes (Russet, red, yellow potatoes in 50lb bags)",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA APHIS / CFIA Phytosanitary",
    is_hazmat: false,
    keywords: "potatoes russet potatoes red potatoes spuds fresh vegetables 50lb bulk"
  },
  {
    hts_code: "0702.00.2000",
    description: "Fresh greenhouse tomatoes (Beefsteak, tomatoes on the vine, grape tomatoes)",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA Greenhouse Inspection",
    is_hazmat: false,
    keywords: "tomatoes greenhouse tomatoes TOV cherry tomatoes roma fresh produce"
  },
  {
    hts_code: "0703.10.4000",
    description: "Commercial yellow, red, and white dry bulb onions",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "onions yellow onions red onions dry onions bulk mesh bags"
  },
  {
    hts_code: "0706.10.2000",
    description: "Fresh carrots (Jumbo carrots, cello carrots, baby cut carrots in cartons)",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "carrots fresh carrots baby carrots root vegetables produce"
  },
  {
    hts_code: "0707.00.2000",
    description: "Fresh greenhouse seedless long English cucumbers and mini cucumbers",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "cucumbers english cucumbers mini cucumbers pickles greenhouse fresh"
  },
  {
    hts_code: "0709.60.2000",
    description: "Fresh bell peppers (Red, yellow, orange sweet bell peppers)",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "peppers bell peppers sweet peppers red peppers green peppers produce"
  },
  {
    hts_code: "0709.70.0000",
    description: "Fresh spinach and baby spinach leaves (Pre-washed salad bags)",
    category: "Produce & Vegetables (Ch. 07)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "spinach baby spinach leafy greens fresh greens salads produce"
  },
  {
    hts_code: "0805.10.0000",
    description: "Fresh oranges (Navel oranges, Valencia juice oranges in carton bins)",
    category: "Agriculture & Fruit (Ch. 08)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA APHIS / CFIA",
    is_hazmat: false,
    keywords: "oranges navel oranges citrus valencia fresh fruit citrus bins"
  },
  {
    hts_code: "0808.10.0000",
    description: "Fresh apples (Gala, Honeycrisp, Fuji, McIntosh in bulk wooden bins)",
    category: "Agriculture & Fruit (Ch. 08)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA Phytosanitary",
    is_hazmat: false,
    keywords: "apples gala honeycrisp fuji mcintosh fresh fruit orchard bins"
  },
  {
    hts_code: "0810.10.0000",
    description: "Fresh strawberries (Cold-chain refrigerated clamshell flats)",
    category: "Agriculture & Fruit (Ch. 08)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "strawberries berries fresh fruit clamshells reefer produce"
  },
  {
    hts_code: "0810.40.0000",
    description: "Fresh blueberries and cranberries (Commercial cultivated berry flats)",
    category: "Agriculture & Fruit (Ch. 08)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA / CFIA",
    is_hazmat: false,
    keywords: "blueberries cranberries fresh berries wild blueberries produce"
  },
  {
    hts_code: "0901.21.0000",
    description: "Roasted coffee beans and ground coffee, not decaffeinated",
    category: "Coffee & Tea (Ch. 09)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "coffee roasted coffee coffee beans arabica robusta espresso ground coffee"
  },
  {
    hts_code: "0902.10.0000",
    description: "Green and black tea in retail packaging / commercial tea bags",
    category: "Coffee & Tea (Ch. 09)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "tea green tea black tea herbal tea tea bags leaves"
  },
  {
    hts_code: "1001.19.0000",
    description: "Durum wheat for pasta production (Bulk hopper rail & truckload grain)",
    category: "Grains & Cereals (Ch. 10)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FGIS / CGC Inspection",
    is_hazmat: false,
    keywords: "durum wheat grain bulk hopper grain elevator pasta flour"
  },
  {
    hts_code: "1001.99.0000",
    description: "Hard Red Spring & Winter Wheat (Bread making flour grain)",
    category: "Grains & Cereals (Ch. 10)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FGIS / CGC Inspection",
    is_hazmat: false,
    keywords: "wheat hard red spring wheat winter wheat milling grain bulk"
  },
  {
    hts_code: "1005.90.2030",
    description: "Yellow dent corn (Feed maize, ethanol production grain)",
    category: "Grains & Cereals (Ch. 10)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FGIS / CGC",
    is_hazmat: false,
    keywords: "corn yellow corn dent corn maize animal feed ethanol grain"
  },
  {
    hts_code: "1006.30.1000",
    description: "Semi-milled or wholly milled long-grain white rice (Parboiled or polished in 50lb sacks)",
    category: "Grains & Rice (Ch. 10)",
    duty_rate_pct: 1.4,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "rice white rice long grain rice jasmine basmati bulk sacks"
  },
  {
    hts_code: "1101.00.0000",
    description: "Wheat or meslin flour (All-purpose bakery flour, bread flour in bulk totes & 50lb bags)",
    category: "Flour & Milling (Ch. 11)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "flour wheat flour bakery flour all purpose bread flour bulk sacks"
  },
  {
    hts_code: "1201.90.0000",
    description: "Soybeans, whether or not broken (Bulk oilseed for crushing / soy meal feed)",
    category: "Oilseeds & Agriculture (Ch. 12)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FGIS / CFIA",
    is_hazmat: false,
    keywords: "soybeans soy beans oilseed bulk hopper soy meal protein crushing"
  },
  {
    hts_code: "1205.10.0000",
    description: "Canola seeds / low erucic acid rape seeds (High-oil export standard)",
    category: "Oilseeds & Agriculture (Ch. 12)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: true,
    pga: "CGC / USDA",
    is_hazmat: false,
    keywords: "canola rapeseed canola seed oilseed bulk hopper prairie grain"
  },
  {
    hts_code: "1214.90.0000",
    description: "Alfalfa hay bales, forage pellets, and silage cubes (Compressed livestock forage)",
    category: "Forage & Hay (Ch. 12)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS",
    is_hazmat: false,
    keywords: "alfalfa hay forage livestock feed hay bales animal feed straw"
  },

  // ==========================================
  // SECTION III & IV: FATS, FOODS, BEVERAGES & TOBACCO (Ch. 15 - 24)
  // ==========================================
  {
    hts_code: "1514.11.0000",
    description: "Crude low erucic acid canola oil (Liquid bulk tanker truckload)",
    category: "Oils & Fats (Ch. 15)",
    duty_rate_pct: 1.7,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "canola oil vegetable oil edible oil liquid tanker bulk cooking oil"
  },
  {
    hts_code: "1517.10.0000",
    description: "Margarine, excluding liquid margarine (Baking & table spreads in retail blocks)",
    category: "Oils & Fats (Ch. 15)",
    duty_rate_pct: 4.8,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "margarine vegetable spread butter substitute baking spread fat"
  },
  {
    hts_code: "1601.00.2000",
    description: "Sausages, hot dogs, bologna, and frankfurters of beef or pork",
    category: "Prepared Meat (Ch. 16)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "USDA FSIS / CFIA",
    is_hazmat: false,
    keywords: "sausages hot dogs frankfurters wieners bologna processed meat deli"
  },
  {
    hts_code: "1701.99.1000",
    description: "Refined cane or beet pure sucrose sugar (Granulated white sugar in 2000lb super-sacks)",
    category: "Sugar & Sweeteners (Ch. 17)",
    duty_rate_pct: 3.6,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / USDA Sugar Quota",
    is_hazmat: false,
    keywords: "sugar cane sugar beet sugar white sugar granulated bulk tote sweeteners"
  },
  {
    hts_code: "1704.90.3550",
    description: "Sugar confectionery (Gummy bears, candy bars, hard candies, fruit chews)",
    category: "Confectionery & Candy (Ch. 17)",
    duty_rate_pct: 5.6,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "candy gummies confectionery sugar sweets hard candy retail pallets"
  },
  {
    hts_code: "1806.31.0000",
    description: "Chocolate bars and cocoa preparations filled with nuts, caramel, or fruit",
    category: "Chocolate & Cocoa (Ch. 18)",
    duty_rate_pct: 5.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "chocolate cocoa candy bar chocolate blocks milk chocolate dark chocolate"
  },
  {
    hts_code: "1902.19.2000",
    description: "Uncooked dry pasta, spaghetti, macaroni, and noodles (Durum semolina)",
    category: "Pasta & Bakery (Ch. 19)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "pasta spaghetti macaroni noodles lasagna semolina dry pasta retail"
  },
  {
    hts_code: "1905.31.0000",
    description: "Sweet biscuits, cookies, and sandwich cream crackers",
    category: "Bakery & Food (Ch. 19)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "cookies biscuits crackers sweet biscuits oreo snacks baked goods"
  },
  {
    hts_code: "1905.90.1041",
    description: "Commercial bread, bagels, buns, pita, and artisan tortillas",
    category: "Bakery & Food (Ch. 19)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "bread buns bagels pita tortillas bakery loaves fresh baked goods"
  },
  {
    hts_code: "2002.90.8000",
    description: "Prepared or preserved tomato paste, tomato purée, and pizza sauce in 55gal drums",
    category: "Preserved Food (Ch. 20)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "tomato paste tomato sauce pizza sauce crushed tomatoes canned paste drums"
  },
  {
    hts_code: "2103.20.4020",
    description: "Tomato ketchup and commercial condiment squeeze bottles",
    category: "Condiments & Sauces (Ch. 21)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "ketchup tomato ketchup condiments sauces heinz squeeze bottles"
  },
  {
    hts_code: "2103.90.9091",
    description: "Mayonnaise, salad dressings, BBQ sauce, and mustard",
    category: "Condiments & Sauces (Ch. 21)",
    duty_rate_pct: 6.4,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "mayonnaise mustard salad dressing bbq sauce sauces condiments"
  },
  {
    hts_code: "2201.10.0000",
    description: "Natural spring water, mineral waters, and non-sparkling bottled drinking water",
    category: "Beverages (Ch. 22)",
    duty_rate_pct: 0.0,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "water bottled water spring water drinking water purified mineral water cases"
  },
  {
    hts_code: "2202.10.0040",
    description: "Carbonated soft drinks, cola, lemon-lime sodas, and energy drinks",
    category: "Beverages (Ch. 22)",
    duty_rate_pct: 0.2,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice",
    is_hazmat: false,
    keywords: "soda pop cola soft drinks energy drinks carbonated beverage cans bottles"
  },
  {
    hts_code: "2203.00.0030",
    description: "Beer made from malt (Commercial canned & bottled lager, ale, IPA in kegs & cases)",
    category: "Alcohol & Beer (Ch. 22)",
    duty_rate_pct: 0.0,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: true,
    pga: "TTB / FDA / CBSA Liquor",
    is_hazmat: false,
    keywords: "beer lager ale ipa craft beer malt beverage kegs cans alcohol"
  },
  {
    hts_code: "2204.21.5000",
    description: "Grape wine, red and white table wine in glass bottles (Alcohol content under 14%)",
    category: "Alcohol & Wine (Ch. 22)",
    duty_rate_pct: 6.3,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: true,
    pga: "TTB / FDA / CBSA Liquor",
    is_hazmat: false,
    keywords: "wine red wine white wine cabernet chardonnay glass bottles winery alcohol"
  },
  {
    hts_code: "2208.30.3030",
    description: "Whiskies (Canadian rye whisky, bourbon, blended whisky in cases)",
    category: "Spirits & Liquor (Ch. 22)",
    duty_rate_pct: 0.0,
    unit: "PROOF_L",
    usmca_eligible: true,
    fda_required: true,
    pga: "TTB / FDA / CBSA Liquor",
    is_hazmat: true,
    keywords: "whisky whiskey rye bourbon liquor spirits alcohol bottles distillery"
  },
  {
    hts_code: "2309.90.1015",
    description: "Complete dog and cat pet food (Dry kibble, canned pet food in cases)",
    category: "Pet Food (Ch. 23)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / USDA APHIS",
    is_hazmat: false,
    keywords: "pet food dog food cat food kibble animal feed pet treats"
  },

  // ==========================================
  // SECTION V: MINERALS, FUELS, OILS & PETROLEUM (Ch. 25 - 27)
  // ==========================================
  {
    hts_code: "2501.00.0000",
    description: "Highway road de-icing rock salt and pure sodium chloride in bulk dump trailer loads",
    category: "Salt & Minerals (Ch. 25)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "salt road salt rock salt deicing sodium chloride winter salt bulk dump"
  },
  {
    hts_code: "2523.29.0000",
    description: "Portland cement (Type I, II, V construction cement in bulk pneumatic tankers & 40kg sacks)",
    category: "Cement & Stone (Ch. 25)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "cement portland cement concrete building materials pneumatic bulk bags"
  },
  {
    hts_code: "2710.12.1500",
    description: "Motor gasoline / automotive unleaded petrol (Regular 87, Premium 93 in tanker trailers)",
    category: "Petroleum & Fuel (Ch. 27)",
    duty_rate_pct: 0.0,
    unit: "BARRELS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA / DOT Hazmat UN1203",
    is_hazmat: true,
    keywords: "gasoline petrol fuel unleaded gas motor fuel tanker truck hazmat UN1203"
  },
  {
    hts_code: "2710.19.0620",
    description: "Ultra-low sulfur diesel fuel (ULSD #2 for commercial highway trucks)",
    category: "Petroleum & Fuel (Ch. 27)",
    duty_rate_pct: 0.0,
    unit: "BARRELS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA / DOT Hazmat UN1993",
    is_hazmat: true,
    keywords: "diesel diesel fuel ULSD commercial truck fuel tanker hazmat UN1993"
  },
  {
    hts_code: "2710.19.3080",
    description: "Heavy-duty synthetic & mineral motor oil, transmission fluids, and gear lubricants",
    category: "Petroleum & Lubricants (Ch. 27)",
    duty_rate_pct: 5.8,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat",
    is_hazmat: true,
    keywords: "motor oil engine oil transmission fluid gear lube lubricants synthetic 15w40"
  },
  {
    hts_code: "2713.20.0000",
    description: "Petroleum asphalt / bitumen for highway paving and roofing shingles (Hot liquid tanker)",
    category: "Petroleum & Asphalt (Ch. 27)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat UN3257",
    is_hazmat: true,
    keywords: "asphalt bitumen liquid asphalt paving road construction hot tanker"
  },

  // ==========================================
  // SECTION VI: CHEMICALS, PHARMACEUTICALS & HAZMAT (Ch. 28 - 38)
  // ==========================================
  {
    hts_code: "2804.30.0000",
    description: "Liquid cryogenic nitrogen (Industrial gas in specialized vacuum cryogenic tankers)",
    category: "Industrial Gases (Ch. 28)",
    duty_rate_pct: 0.0,
    unit: "M3",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat UN1977 Class 2.2",
    is_hazmat: true,
    keywords: "nitrogen liquid nitrogen cryogenic industrial gas gas tanker UN1977"
  },
  {
    hts_code: "2814.10.0000",
    description: "Anhydrous ammonia (Agricultural fertilizer and industrial refrigerant gas)",
    category: "Inorganic Chemicals (Ch. 28)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat UN1005 Class 2.2",
    is_hazmat: true,
    keywords: "ammonia anhydrous ammonia fertilizer gas refrigerant UN1005 hazmat"
  },
  {
    hts_code: "3004.20.0000",
    description: "Medicaments containing antibiotics in dosage form (Amoxicillin, Azithromycin capsules)",
    category: "Pharmaceuticals (Ch. 30)",
    duty_rate_pct: 0.0,
    unit: "PKG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / Health Canada",
    is_hazmat: false,
    keywords: "antibiotics medicine pharmaceuticals pills capsules dosage pharma drugs"
  },
  {
    hts_code: "3004.90.9203",
    description: "Formulated therapeutic pharmaceutical products, analgesics, blood pressure & cardiovascular drugs",
    category: "Pharmaceuticals (Ch. 30)",
    duty_rate_pct: 0.0,
    unit: "PKG",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Prior Notice / Health Canada",
    is_hazmat: false,
    keywords: "pharmaceuticals medicines drugs prescription tablets pills healthcare reefer"
  },
  {
    hts_code: "3102.10.0000",
    description: "Urea, whether or not in aqueous solution (Diesel Exhaust Fluid DEF / agricultural fertilizer)",
    category: "Fertilizers & DEF (Ch. 31)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA / CFIA",
    is_hazmat: false,
    keywords: "urea DEF diesel exhaust fluid fertilizer bulk agricultural prills"
  },
  {
    hts_code: "3208.10.0000",
    description: "Paints and varnishes based on synthetic polymers, polyester paints (Flammable liquid)",
    category: "Paints & Coatings (Ch. 32)",
    duty_rate_pct: 3.7,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat UN1263 Class 3",
    is_hazmat: true,
    keywords: "paint coating varnish polyester enamel industrial paint hazmat UN1263"
  },
  {
    hts_code: "3402.90.5050",
    description: "Commercial surface-active agents, industrial degreasers, and cleaning preparations",
    category: "Chemicals & Cleaners (Ch. 34)",
    duty_rate_pct: 3.7,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat / EPA",
    is_hazmat: true,
    keywords: "cleaners industrial detergent degreaser surfactant chemicals drums totes"
  },
  {
    hts_code: "3824.99.9297",
    description: "Ethylene glycol engine coolant / antifreeze for automotive & commercial diesel engines",
    category: "Chemicals & Fluids (Ch. 38)",
    duty_rate_pct: 0.0,
    unit: "LITERS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT / EPA",
    is_hazmat: false,
    keywords: "antifreeze coolant ethylene glycol radiator fluid engine coolant drums jugs"
  },

  // ==========================================
  // SECTION VII: PLASTICS, RUBBERS & HEAVY TIRES (Ch. 39 - 40)
  // ==========================================
  {
    hts_code: "3901.10.5000",
    description: "Polyethylene raw virgin plastic resin pellets (Low-density LDPE in 25kg bags & hopper cars)",
    category: "Plastics & Polymers (Ch. 39)",
    duty_rate_pct: 6.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "plastic pellets resin polyethylene LDPE raw polymer virgin pellets bulk"
  },
  {
    hts_code: "3902.10.0000",
    description: "Polypropylene raw plastic polymer pellets (PP extrusion & injection molding grade)",
    category: "Plastics & Polymers (Ch. 39)",
    duty_rate_pct: 6.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "polypropylene PP plastic pellets polymer injection molding extrusion"
  },
  {
    hts_code: "3923.10.0000",
    description: "Plastic boxes, cases, crates, and storage totes for logistics and warehouse material handling",
    category: "Plastics & Packaging (Ch. 39)",
    duty_rate_pct: 3.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "plastic boxes totes crates storage bins plastic containers warehouse"
  },
  {
    hts_code: "3923.30.0090",
    description: "Plastic carboys, bottles, flasks, and beverage containers (PET / HDPE empty preforms)",
    category: "Plastics & Packaging (Ch. 39)",
    duty_rate_pct: 3.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "plastic bottles PET bottles jugs containers packaging HDPE preforms"
  },
  {
    hts_code: "3926.90.9990",
    description: "Other articles of plastics and articles of other materials of headings 3901 to 3914",
    category: "Plastics & Fabrications (Ch. 39)",
    duty_rate_pct: 5.3,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "plastic parts molded plastic plastic fittings brackets polymer goods"
  },
  {
    hts_code: "4011.10.1010",
    description: "New pneumatic passenger car radial tires (DOT speed rated P-Metric all-season)",
    category: "Rubber & Tires (Ch. 40)",
    duty_rate_pct: 4.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT NHTSA Spec",
    is_hazmat: false,
    keywords: "tires car tires passenger tires radial tires rubber all season winter tires"
  },
  {
    hts_code: "4011.20.1015",
    description: "New pneumatic radial tires of rubber for commercial heavy-duty trucks & buses (295/75R22.5, 11R22.5)",
    category: "Rubber & Tires (Ch. 40)",
    duty_rate_pct: 3.4,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT NHTSA Spec",
    is_hazmat: false,
    keywords: "truck tires commercial tires semi truck tires 295 75r22 5 steer drive trailer"
  },
  {
    hts_code: "4010.39.9000",
    description: "Heavy-duty industrial rubber conveyor belts and engine drive belts",
    category: "Rubber Products (Ch. 40)",
    duty_rate_pct: 2.8,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "conveyor belts rubber belts drive belts fan belts transmission vulcanized"
  },

  // ==========================================
  // SECTION IX & X: LUMBER, WOOD, PAPER & PACKAGING (Ch. 44 - 49)
  // ==========================================
  {
    hts_code: "4403.21.0000",
    description: "Rough logs of pine, spruce, or fir, whether or not stripped of bark",
    category: "Forestry & Logs (Ch. 44)",
    duty_rate_pct: 0.0,
    unit: "M3",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS / CFIA Forestry",
    is_hazmat: false,
    keywords: "logs rough wood timber forestry spruce pine fir log haul flatbed"
  },
  {
    hts_code: "4407.11.0000",
    description: "Sawn spruce, pine, and fir (SPF) dimensional 2x4, 2x6 construction lumber (Softwood)",
    category: "Lumber & Wood (Ch. 44)",
    duty_rate_pct: 0.0,
    unit: "M3",
    usmca_eligible: true,
    fda_required: false,
    pga: "SLA / USDA / CFIA",
    is_hazmat: false,
    keywords: "lumber wood 2x4 2x6 framing lumber SPF dimensional lumber softwood building"
  },
  {
    hts_code: "4412.33.0000",
    description: "Structural plywood panels, non-coniferous hardwood face sheets for construction subfloors",
    category: "Lumber & Plywood (Ch. 44)",
    duty_rate_pct: 8.0,
    unit: "M3",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA TSCA Title VI (Formaldehyde)",
    is_hazmat: false,
    keywords: "plywood sheets subfloor construction panels wood sheets sheathing"
  },
  {
    hts_code: "4410.11.0000",
    description: "Oriented Strand Board (OSB) and particle board construction sheathing panels",
    category: "Lumber & OSB (Ch. 44)",
    duty_rate_pct: 0.0,
    unit: "M3",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA TSCA Title VI",
    is_hazmat: false,
    keywords: "OSB oriented strand board particle board sheathing roof sheathing wall panels"
  },
  {
    hts_code: "4415.20.0000",
    description: "Wooden pallets, GMA 48x40 box pallets, collars, and load boards (ISPM-15 Heat Treated / HT stamped)",
    category: "Packaging & Pallets (Ch. 44)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "USDA APHIS / CFIA ISPM-15",
    is_hazmat: false,
    keywords: "pallets wooden pallets GMA pallets heat treated ISPM 15 skids wood packaging"
  },
  {
    hts_code: "4804.11.0000",
    description: "Unbleached kraftliner in giant rolls for manufacturing corrugated shipping boxes",
    category: "Paper & Paperboard (Ch. 48)",
    duty_rate_pct: 0.0,
    unit: "TONS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "kraft paper paper rolls kraftliner paperboard containerboard rolls"
  },
  {
    hts_code: "4819.10.0040",
    description: "Corrugated paper and paperboard shipping boxes, cartons, and master shippers",
    category: "Paper & Packaging (Ch. 48)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "boxes cardboard boxes corrugated cartons shipping boxes packaging cartons"
  },
  {
    hts_code: "4819.20.0040",
    description: "Folding cartons, retail cereal & snack boxes of non-corrugated paperboard",
    category: "Paper & Packaging (Ch. 48)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "folding cartons retail boxes paperboard packaging printed boxes"
  },

  // ==========================================
  // SECTION XI & XII: TEXTILES, APPAREL & WORKWEAR (Ch. 50 - 67)
  // ==========================================
  {
    hts_code: "5407.20.0000",
    description: "Woven fabrics of synthetic woven polypropylene strips (Silt fencing, geotextile fabric rolls)",
    category: "Textiles & Geotextiles (Ch. 54)",
    duty_rate_pct: 8.5,
    unit: "M2",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "geotextile fabric silt fence polypropylene fabric rolls woven textiles"
  },
  {
    hts_code: "6109.10.0004",
    description: "Men's and boys' cotton T-shirts, knit singlets, and tank tops",
    category: "Apparel & Clothing (Ch. 61)",
    duty_rate_pct: 16.5,
    unit: "DOZ",
    usmca_eligible: true,
    fda_required: false,
    pga: "CPSC / FTC Care Labeling",
    is_hazmat: false,
    keywords: "tshirts shirts cotton apparel clothing garments retail knitwear"
  },
  {
    hts_code: "6203.42.4011",
    description: "Men's denim blue jeans, work trousers, and cotton dungarees",
    category: "Apparel & Clothing (Ch. 62)",
    duty_rate_pct: 16.6,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FTC",
    is_hazmat: false,
    keywords: "jeans denim pants trousers work pants clothing apparel"
  },
  {
    hts_code: "6211.32.0040",
    description: "Industrial flame-resistant work coveralls, hi-vis reflective safety overalls (Cotton/Nomex)",
    category: "Safety Workwear (Ch. 62)",
    duty_rate_pct: 8.1,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "OSHA / CPSC",
    is_hazmat: false,
    keywords: "coveralls workwear flame resistant safety overalls hi vis safety garments"
  },
  {
    hts_code: "6216.00.5820",
    description: "Heavy-duty split cowhide leather work gloves and Kevlar cut-resistant gloves",
    category: "Safety Workwear (Ch. 62)",
    duty_rate_pct: 12.5,
    unit: "DOZ",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "work gloves leather gloves safety gloves kevlar gloves protective gear"
  },
  {
    hts_code: "6403.91.6045",
    description: "Steel-toe puncture-resistant leather industrial work boots (CSA / ASTM Certified)",
    category: "Safety Footwear (Ch. 64)",
    duty_rate_pct: 8.5,
    unit: "PAIRS",
    usmca_eligible: true,
    fda_required: false,
    pga: "ASTM / CSA Safety Spec",
    is_hazmat: false,
    keywords: "work boots steel toe boots safety footwear leather boots construction boots"
  },

  // ==========================================
  // SECTION XV: BASE METALS, STEEL & ALUMINUM (Ch. 72 - 83)
  // ==========================================
  {
    hts_code: "7208.38.0015",
    description: "Hot-rolled carbon steel coils, width 600mm or more, thickness 4.75mm to 10mm",
    category: "Steel & Metallurgy (Ch. 72)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232 Steel Exemption",
    is_hazmat: false,
    keywords: "steel coils hot rolled steel carbon steel coil steel master coil metallurgy"
  },
  {
    hts_code: "7209.16.0030",
    description: "Cold-rolled carbon steel coils, width 600mm+, thickness 1mm to 3mm",
    category: "Steel & Metallurgy (Ch. 72)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "cold rolled steel CRC sheet steel automotive steel coil raw steel"
  },
  {
    hts_code: "7210.49.0090",
    description: "Galvanized zinc-coated corrosion-resistant flat steel sheets and coils",
    category: "Steel & Metallurgy (Ch. 72)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "galvanized steel zinc coated steel sheet metal automotive stamping"
  },
  {
    hts_code: "7214.20.0000",
    description: "Deformed carbon steel reinforcing bars for concrete (Rebar #4, #5, #6 in 40ft bundles)",
    category: "Steel & Construction (Ch. 72)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "rebar concrete rebar steel bars reinforcing bars construction steel flatbed"
  },
  {
    hts_code: "7216.33.0060",
    description: "Structural steel wide-flange H-beams and I-beams for commercial buildings and bridges",
    category: "Structural Steel (Ch. 72)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "steel beams h beams i beams structural steel wide flange bridge steel flatbed"
  },
  {
    hts_code: "7304.19.1000",
    description: "Seamless steel line pipe for oil, gas, and petrochemical pipelines (API 5L Spec)",
    category: "Steel Pipe & Tubing (Ch. 73)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT PHMSA",
    is_hazmat: false,
    keywords: "steel pipe seamless pipe line pipe oil gas tubing pipeline steel"
  },
  {
    hts_code: "7318.15.2095",
    description: "High-tensile Grade 8 hex cap bolts, carriage bolts, and carbon steel fasteners",
    category: "Fasteners & Hardware (Ch. 73)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "bolts hex bolts fasteners screws nuts grade 8 high tensile steel hardware"
  },
  {
    hts_code: "7318.16.0085",
    description: "Steel hex nuts, lock nuts, flange nuts, and square nuts",
    category: "Fasteners & Hardware (Ch. 73)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "nuts hex nuts lock nuts hardware fasteners steel nuts"
  },
  {
    hts_code: "7601.10.6000",
    description: "Unwrought non-alloyed aluminum ingots and T-bars (Raw primary smelter metal)",
    category: "Aluminum (Ch. 76)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232 Aluminum",
    is_hazmat: false,
    keywords: "aluminum ingots raw aluminum t-bars smelter primary aluminum flatbed"
  },
  {
    hts_code: "7604.29.1000",
    description: "Aluminum alloy extruded profiles, architectural window framing extrusions, and channels",
    category: "Aluminum (Ch. 76)",
    duty_rate_pct: 1.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "aluminum extrusions aluminum channels window frames alloy profiles metal"
  },
  {
    hts_code: "7606.12.3090",
    description: "Aluminum alloy coils and flat rolled sheet (5052, 6061 alloy for truck trailer skins & stamping)",
    category: "Aluminum (Ch. 76)",
    duty_rate_pct: 2.7,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "Section 232",
    is_hazmat: false,
    keywords: "aluminum coils aluminum sheet trailer skin 5052 6061 sheet metal"
  },

  // ==========================================
  // SECTION XVI: MACHINERY, ENGINES, ROBOTICS & ELECTRICAL (Ch. 84 - 85)
  // ==========================================
  {
    hts_code: "8408.20.2000",
    description: "Heavy-duty diesel engines for highway commercial tractors (13L / 15L Cummins, Detroit DD15, PACCAR)",
    category: "Engines & Motors (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA Clean Air Engine Certificate",
    is_hazmat: false,
    keywords: "diesel engine truck engine cummins detroit dd15 paccar commercial motor"
  },
  {
    hts_code: "8411.82.4000",
    description: "Industrial heavy-duty gas turbines of a power exceeding 5,000 kW for power plants",
    category: "Machinery & Turbines (Ch. 84)",
    duty_rate_pct: 2.2,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "gas turbine turbine power plant generator industrial turbine heavy machinery"
  },
  {
    hts_code: "8413.70.2004",
    description: "Centrifugal water pumps, industrial slurry pumps, and submersible pumps",
    category: "Pumps & Hydraulics (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "water pump centrifugal pump slurry pump hydraulics industrial pumps"
  },
  {
    hts_code: "8414.80.1685",
    description: "Rotary screw air compressors and industrial shop air compressor systems",
    category: "Compressors & Air (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "air compressor rotary screw compressor pneumatic industrial air compressors"
  },
  {
    hts_code: "8415.82.0105",
    description: "Commercial rooftop HVAC air conditioning units and heat pumps",
    category: "HVAC & Cooling (Ch. 84)",
    duty_rate_pct: 1.4,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA SNAP (Refrigerant)",
    is_hazmat: false,
    keywords: "HVAC air conditioner heat pump rooftop unit cooling refrigeration chiller"
  },
  {
    hts_code: "8418.69.0180",
    description: "Commercial trailer transport refrigeration units (Thermo King, Carrier Transicold Reefer units)",
    category: "Reefer Units & Cooling (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA SNAP",
    is_hazmat: false,
    keywords: "reefer unit thermo king carrier transicold trailer refrigeration cooling unit"
  },
  {
    hts_code: "8421.39.8015",
    description: "Diesel Particulate Filters (DPF) and Catalytic Exhaust Scrubbing Systems for semi-trucks",
    category: "Exhaust & Emissions (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA",
    is_hazmat: false,
    keywords: "DPF diesel particulate filter catalytic converter exhaust emissions SCR"
  },
  {
    hts_code: "8427.20.8000",
    description: "Self-propelled commercial forklift trucks powered by internal combustion diesel/LPG engines",
    category: "Material Handling (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA / OSHA",
    is_hazmat: false,
    keywords: "forklift lift truck hyster toyota forklift material handling warehouse equipment"
  },
  {
    hts_code: "8457.10.0050",
    description: "CNC vertical machining centers, computer-controlled 5-axis metal milling machines",
    category: "CNC Machine Tools (Ch. 84)",
    duty_rate_pct: 4.2,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "CNC machine milling machine lathe machining center metal fabrication tool"
  },
  {
    hts_code: "8471.30.0100",
    description: "Portable automatic data processing machines, commercial laptops and tablet computers",
    category: "Computers & Electronics (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FCC / DOT Lithium Battery",
    is_hazmat: false,
    keywords: "laptops computers notebooks tablets electronics computing dell hp lenovo"
  },
  {
    hts_code: "8471.50.0150",
    description: "Rack-mount data center enterprise servers and mainframes",
    category: "Computers & Servers (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FCC",
    is_hazmat: false,
    keywords: "servers data center rack servers enterprise computing cloud servers"
  },
  {
    hts_code: "8479.50.0000",
    description: "Industrial multi-axis articulated robots for factory welding, painting & automated assembly",
    category: "Industrial Robotics (Ch. 84)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "robots industrial robots fanuc abb kuka automation articulated arm"
  },
  {
    hts_code: "8481.80.9050",
    description: "Industrial steel ball valves, butterfly valves, gate valves, and check valves",
    category: "Valves & Piping (Ch. 84)",
    duty_rate_pct: 2.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "valves ball valve butterfly valve gate valve check valve plumbing industrial"
  },
  {
    hts_code: "8482.10.5028",
    description: "Single-row radial ball bearings and heavy-duty tapered roller wheel bearings",
    category: "Bearings & Power (Ch. 84)",
    duty_rate_pct: 9.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "bearings ball bearings roller bearings wheel bearings skf timken machinery"
  },
  {
    hts_code: "8501.32.2000",
    description: "Electric DC motors and AC electric drive motors (Power exceeding 750 W but <= 75 kW)",
    category: "Electric Motors (Ch. 85)",
    duty_rate_pct: 2.8,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOE Energy Standard",
    is_hazmat: false,
    keywords: "electric motor AC motor DC motor electric drive industrial motor baldore"
  },
  {
    hts_code: "8504.22.0000",
    description: "Liquid dielectric step-down electrical utility power transformers (Power 650 kVA to 10,000 kVA)",
    category: "Power Transformers (Ch. 85)",
    duty_rate_pct: 1.6,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOE",
    is_hazmat: false,
    keywords: "transformer power transformer electrical substation utility step down transformer"
  },
  {
    hts_code: "8507.60.0020",
    description: "Lithium-ion commercial truck and electric vehicle traction battery packs (UN3480 Hazmat Class 9)",
    category: "Batteries & CleanTech (Ch. 85)",
    duty_rate_pct: 3.4,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT Hazmat UN3480 Class 9",
    is_hazmat: true,
    keywords: "lithium battery EV battery traction pack battery packs UN3480 energy storage"
  },
  {
    hts_code: "8517.62.0050",
    description: "Commercial routers, network ethernet switches, modems, and 5G cellular base stations",
    category: "Telecommunications (Ch. 85)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FCC",
    is_hazmat: false,
    keywords: "routers switches networking cisco ethernet telecom 5g modems electronics"
  },
  {
    hts_code: "8541.43.0010",
    description: "Photovoltaic solar cells assembled in modules or made up into panels (Solar PV Panels)",
    category: "Solar & CleanTech (Ch. 85)",
    duty_rate_pct: 0.0,
    unit: "WATT",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOE / CBP Uyghur Forced Labor (UFLPA)",
    is_hazmat: false,
    keywords: "solar panels solar cells photovoltaic PV modules renewable energy solar power"
  },
  {
    hts_code: "8542.31.0001",
    description: "Monolithic integrated circuits, microprocessors, and memory controllers (Semiconductor Silicon Chips)",
    category: "Semiconductors (Ch. 85)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "microchips semiconductors integrated circuits CPU memory chips intel nvidia"
  },
  {
    hts_code: "8544.30.0000",
    description: "Insulated ignition wiring sets and vehicle electrical wiring harnesses for automotive/trucks",
    category: "Electrical Wiring (Ch. 85)",
    duty_rate_pct: 2.5,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "wiring harness wire cables automotive wiring ignition harness electrical cables"
  },

  // ==========================================
  // SECTION XVII: VEHICLES, TRUCKS, TRAILERS & AEROSPACE (Ch. 87 - 88)
  // ==========================================
  {
    hts_code: "8701.20.0045",
    description: "Road tractors for semi-trailers (Class 8 heavy highway sleeper & daycab tractors)",
    category: "Commercial Vehicles (Ch. 87)",
    duty_rate_pct: 4.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT NHTSA / EPA",
    is_hazmat: false,
    keywords: "semi truck tractor highway tractor freightliner kenworth peterbilt volvo cab"
  },
  {
    hts_code: "8708.29.5060",
    description: "Stampings & body parts of motor vehicles (Aluminum/steel doors, hoods, body panels)",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "auto parts stampings body panels hoods doors fenders automotive parts metal"
  },
  {
    hts_code: "8708.30.5030",
    description: "Mounted brake linings and disc brake pads for commercial trucks & autos",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "brake pads brakes disc brakes brake shoes truck brakes friction linings"
  },
  {
    hts_code: "8708.40.1110",
    description: "Gear boxes (transmissions) for commercial motor vehicles and trucks (Eaton, Allison, DT12)",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "transmission gearbox automatic transmission eaton allison truck transmission"
  },
  {
    hts_code: "8708.50.8100",
    description: "Drive-axles with differential, whether or not provided with other transmission components",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "axles drive axles differential tandem axle truck axles meritor dana"
  },
  {
    hts_code: "8708.70.4530",
    description: "Road wheels, parts and accessories for motor vehicles (Forged aluminum & steel truck wheels)",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "wheels rims truck wheels alcoa alloy wheels steel wheels 22.5 rims"
  },
  {
    hts_code: "8708.80.1600",
    description: "Suspension systems and parts thereof (Air ride bags, leaf springs, shock absorbers)",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "suspension shock absorbers air springs air ride leaf springs truck suspension"
  },
  {
    hts_code: "8708.91.5000",
    description: "Radiators and charge air coolers for commercial tractors and motor vehicles",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT",
    is_hazmat: false,
    keywords: "radiator intercooler charge air cooler cooling cooling system truck radiator"
  },
  {
    hts_code: "8708.92.5000",
    description: "Mufflers, exhaust pipes, and tailpipes for internal combustion engines",
    category: "Automotive (Ch. 87)",
    duty_rate_pct: 2.5,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA / DOT",
    is_hazmat: false,
    keywords: "muffler exhaust exhaust pipes stacks chrome pipes truck exhaust"
  },
  {
    hts_code: "8716.39.0090",
    description: "Semi-trailers for the transport of goods (53ft dry vans, flatbeds, refrigerated reefers, drop decks)",
    category: "Trailers & Semi-Trailers (Ch. 87)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT NHTSA Spec",
    is_hazmat: false,
    keywords: "semi trailer dry van flatbed 53ft trailer reefer drop deck great dane wabash"
  },
  {
    hts_code: "8807.30.0030",
    description: "Parts of aerospace airplanes or helicopters (Structural titanium/aluminum airframe fittings)",
    category: "Aerospace (Ch. 88)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "FAA / Transport Canada",
    is_hazmat: false,
    keywords: "aerospace aircraft parts airplane parts airframe titanium fittings boeing airbus"
  },
  {
    hts_code: "8807.30.0090",
    description: "Hydraulic actuators and flight control mechanism assemblies for commercial aircraft",
    category: "Aerospace (Ch. 88)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FAA / Transport Canada",
    is_hazmat: false,
    keywords: "avionics actuators flight control aircraft hydraulics aerospace landing gear"
  },

  // ==========================================
  // SECTION XVIII: MEDICAL, OPTICAL & INSTRUMENTS (Ch. 90)
  // ==========================================
  {
    hts_code: "9018.90.8000",
    description: "Instruments and appliances used in medical, surgical, dental or veterinary sciences",
    category: "Medical Devices (Ch. 90)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA Medical Device CDRH",
    is_hazmat: false,
    keywords: "medical devices surgical instruments hospital equipment dental diagnostic healthcare"
  },
  {
    hts_code: "9018.31.0000",
    description: "Syringes, with or without needles, for medical and veterinary vaccination",
    category: "Medical Supplies (Ch. 90)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA CDRH",
    is_hazmat: false,
    keywords: "syringes needles medical supplies vaccination healthcare sterile"
  },
  {
    hts_code: "9018.39.0020",
    description: "Medical catheters, cannulas, and intravenous IV infusion tubing sets",
    category: "Medical Supplies (Ch. 90)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA CDRH",
    is_hazmat: false,
    keywords: "catheters IV tubing infusion sets cannulas medical healthcare hospital supplies"
  },
  {
    hts_code: "9022.14.0000",
    description: "Apparatus based on the use of X-rays for medical, surgical, or dental examinations (CT / X-ray scanners)",
    category: "Medical Equipment (Ch. 90)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA CDRH Radiation",
    is_hazmat: false,
    keywords: "xray ct scanner medical imaging radiology hospital diagnostic equipment"
  },
  {
    hts_code: "9026.10.2040",
    description: "Electronic flow meters, pressure sensors, and liquid level gauges",
    category: "Instrumentation (Ch. 90)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "flow meters pressure gauges sensors level transmitter instrumentation gauges"
  },
  {
    hts_code: "9032.10.0030",
    description: "Automatic thermostats for commercial HVAC, refrigeration, and automotive climate control",
    category: "Controls & Thermostats (Ch. 90)",
    duty_rate_pct: 1.7,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "thermostat temperature control HVAC controls digital thermostat sensor"
  },

  // ==========================================
  // SECTION XX: FURNITURE, LIGHTING & WAREHOUSE (Ch. 94 - 96)
  // ==========================================
  {
    hts_code: "9401.30.8031",
    description: "Swivel ergonomic office desk chairs with variable height adjustments",
    category: "Furniture (Ch. 94)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "office chairs swivel chair ergonomic chair desk chair furniture seating"
  },
  {
    hts_code: "9402.90.0020",
    description: "Hospital beds with mechanical fittings and examination tables",
    category: "Medical Furniture (Ch. 94)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: true,
    pga: "FDA CDRH",
    is_hazmat: false,
    keywords: "hospital beds medical beds examination tables patient furniture"
  },
  {
    hts_code: "9403.20.0020",
    description: "Heavy-duty steel warehouse pallet rack uprights, beams, and modular industrial shelving",
    category: "Warehouse Equipment (Ch. 94)",
    duty_rate_pct: 0.0,
    unit: "KG",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "pallet racks racking shelving warehouse racking steel beams uprights storage"
  },
  {
    hts_code: "9403.60.8081",
    description: "Commercial wooden office furniture, executive conference tables and credenzas",
    category: "Furniture (Ch. 94)",
    duty_rate_pct: 0.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "EPA TSCA Title VI",
    is_hazmat: false,
    keywords: "tables desks wooden furniture conference tables credenza office furniture"
  },
  {
    hts_code: "9404.21.0000",
    description: "Mattresses of cellular rubber or plastics (Memory foam mattresses, bed in a box)",
    category: "Mattresses & Bedding (Ch. 94)",
    duty_rate_pct: 3.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "CPSC 16 CFR Part 1633 (Flammability)",
    is_hazmat: false,
    keywords: "mattress memory foam bed in a box foam mattress bedding sleep"
  },
  {
    hts_code: "9405.42.8440",
    description: "Commercial high-bay LED industrial warehouse luminaires and light fittings",
    category: "Lighting & Electrical (Ch. 94)",
    duty_rate_pct: 6.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOE / FCC",
    is_hazmat: false,
    keywords: "LED lights high bay lighting warehouse lights luminaires industrial lighting fixtures"
  },
  {
    hts_code: "9406.90.0030",
    description: "Prefabricated modular steel buildings, commercial site trailers, and temporary office units",
    category: "Prefab Buildings (Ch. 94)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "prefabricated buildings modular offices site trailers steel structures flatbed"
  },
  {
    hts_code: "9504.50.0000",
    description: "Video game consoles and gaming controllers (PlayStation, Xbox, Nintendo)",
    category: "Consumer Goods (Ch. 95)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "FCC",
    is_hazmat: false,
    keywords: "video games gaming consoles controllers playstation xbox nintendo toys retail"
  },
  {
    hts_code: "9506.91.0030",
    description: "Commercial fitness equipment, treadmills, elliptical trainers, and weight machines",
    category: "Gym Equipment (Ch. 95)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "None",
    is_hazmat: false,
    keywords: "gym equipment fitness treadmills weights elliptical workout machines exercise"
  },
  {
    hts_code: "8712.00.1520",
    description: "Bicycles, adult road, gravel, and mountain bicycles with wheel diameter over 63.5cm",
    category: "Bicycles & Mobility (Ch. 87)",
    duty_rate_pct: 11.0,
    unit: "PCS",
    usmca_eligible: true,
    fda_required: false,
    pga: "CPSC",
    is_hazmat: false,
    keywords: "bicycles bikes mountain bikes road bikes cycling consumer goods"
  },
  {
    hts_code: "8711.60.0000",
    description: "Electric motorcycles, electric mopeds, and e-bikes with auxiliary electric motors",
    category: "Electric Vehicles (Ch. 87)",
    duty_rate_pct: 0.0,
    unit: "UNITS",
    usmca_eligible: true,
    fda_required: false,
    pga: "DOT NHTSA / EPA",
    is_hazmat: true,
    keywords: "ebikes electric bikes electric scooters mopeds motorcycles UN3481"
  }
];

/**
 * Intelligent Search Engine for HTS codes.
 * Returns sorted list of matching codes based on code string, description, category, or keywords.
 */
export function searchHtsCodes(query, maxResults = 25) {
  if (!query || !query.trim()) {
    return HTS_MASTER_DATABASE.slice(0, maxResults);
  }

  const raw = query.trim().toLowerCase();
  const tokens = raw.split(/\s+/).filter(Boolean);

  const scored = HTS_MASTER_DATABASE.map((item) => {
    let score = 0;
    const codeClean = item.hts_code.replace(/[\.\s]/g, "").toLowerCase();
    const queryClean = raw.replace(/[\.\s]/g, "");

    // 1. Direct HTS code prefix match
    if (codeClean.startsWith(queryClean)) score += 100;
    else if (codeClean.includes(queryClean)) score += 60;

    // 2. Exact description match
    const desc = item.description.toLowerCase();
    if (desc.includes(raw)) score += 50;

    // 3. Keyword / category match
    const kw = (item.keywords || "").toLowerCase();
    const cat = item.category.toLowerCase();
    if (kw.includes(raw) || cat.includes(raw)) score += 30;

    // 4. Token matches
    tokens.forEach((t) => {
      if (desc.includes(t)) score += 15;
      if (kw.includes(t)) score += 10;
      if (cat.includes(t)) score += 8;
    });

    return { ...item, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
