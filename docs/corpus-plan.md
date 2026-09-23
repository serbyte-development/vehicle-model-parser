# Independent vehicle corpus plan

Status: the frozen PRD is implemented in the independently owned corpus files. This document preserves the initial 180-scenario design inventory. The first executable suite contained 200 synthetic messages prepared before parser execution, plus the separate real message. See `corpus.md` for final counts, provenance, generator behavior, and the documented mutation-oracle correction.

## Purpose and provenance

The corpus tests vehicle mention extraction from automotive inquiries. Labels describe the text's mentions and possible makes. Ownership, purchase intent, historical lead accuracy, and model-year validity require separate evidence.

Three sources stay separately counted:

1. One anonymized real-message excerpt supplied by the user, retained as a regression.
2. At least 180 original, hand-authored synthetic cases. Each receives an expected result before running the parser.
3. Deterministic generated catalog coverage and metamorphic cases. These measure catalog reach and invariants; they remain separate from the authored message results.

Private production leads and private name-parser benchmarks are outside this work. Public vehicle catalogs supply spelling and make relationships only. No public customer posts are being copied into the authored corpus.

## Proposed coverage budget

| Primary category | Minimum cases | Examples and purpose |
| --- | ---: | --- |
| Canonical realistic inquiries | 30 | Paint correction, tint, ceramic coating, branch scratches, pet hair, trade-ins; varied makes, ages, sentence positions, and writing styles. |
| Formatting and explicit aliases | 20 | `4 runner`, `f150`, `F-150`, `cx5`, `chevy`; case, separators, abbreviations. |
| Human-plausible typos | 15 | `silverdo`, `camery`, `wranger`; isolated omissions and transpositions with enough identifying evidence. |
| Hard negatives | 55 | Ordinary uses of focus, fit, edge, compass, pilot, accord, air, ram, smart, mini, and car-care vocabulary. |
| Multiple and repeated mentions | 10 | Separate vehicles, repeated model, old versus replacement vehicle, make order, one true model surrounded by common words. |
| Ambiguity and contradictions | 12 | Shared model names with complete make sets; explicit compatible make; `Toyota Civic`; explicit corrections in conversation. |
| Specificity and overlap | 12 | Grand Cherokee L, Bronco Sport, RAV4 Prime, exact cab variants, longer model names containing shorter models. |
| Numbers and boundaries | 10 | Phone-like strings, years, invoice totals, pure numeric models with explicit makes, embedded identifiers. |
| Unicode and text shape | 10 | Curly apostrophes, Unicode dashes and spaces, emoji before a match, CRLF, empty strings, whitespace, long input. |
| Additional independent regressions | 6 | Cases identified during source review, authored before inspecting parser outputs. |

The starting target is 180 synthetic cases plus the real example. Additional cases can increase coverage without changing the label rules.

## Original sentinel cases

These cases establish expected semantics while the serialized API is pending. `[]` means no vehicle model mention. The coordinator has specified that make-only mentions produce no output and `findMakes` is the union of the model mentions' makes.

| Text | Expected model semantics |
| --- | --- |
| My 4runner has branch scratches down both sides. Can you quote paint correction? | 4Runner; Toyota. |
| Need the hood wrapped on a 4 runner before hunting season. | 4Runner; Toyota. |
| the f150 is too tall for my garage, do you offer mobile washes? | Generic F-150 family; Ford; no invented cab. |
| Can the cx5 be dropped off the night before? | CX-5; MAZDA, with display spelling settled by the contract. |
| chevy silverdo needs the bed sides polished after a camping trip | Generic Silverado family; Chevrolet. |
| My camery has a cloudy spot where the bird mess sat. | Camry; Toyota. |
| What would full front film cost for my Jeep wranger? | Wrangler; Jeep; explicit make resolves the nearby Ranger spelling. |
| Please focus on the door handles when you polish the car. | []. |
| Can you fit my car in before lunch? | []. |
| The edge of the film is collecting dirt. | []. |
| I left a compass on the dashboard while the car was detailed. | []. |
| I'm a pilot and need a ride back to the airport after drop-off. | []. |
| My Ford Focus needs the door handles polished. | Focus; Ford. |
| Can you fit my Honda Fit in before lunch? | Fit; Honda; the verb remains ordinary language. |
| The edge of the wrap on my Ford Edge is lifting. | Edge; Ford; one model occurrence. |
| The compass display in my Jeep Compass is dim. | Compass; Jeep; one model occurrence. |
| I'm a pilot and the Honda Pilot needs a deep clean. | Pilot; Honda; one model occurrence. |
| Is there a charge to collect the car, and can I pay by card? | []. |
| My budget is 1500 and the paint is from 2017. | []. |
| Call 208-555-0150 after 4; the invoice reference is 2024. | []. |
| I have a Civic and an Outback. Could both get interior cleaning? | Civic; Honda. Outback; Subaru. |
| My Bronco Sport needs film on the hood and both mirrors. | Bronco Sport; Ford; the overlapping Bronco is absorbed. |
| Can you coat a Silverado 1500 Crew Cab without removing the bed cover? | Exact Silverado 1500 Crew Cab; Chevrolet. |
| 🚙 My 4Runner has sap on the roof. Is that removable? | 4Runner; Toyota; source offsets preserve the emoji. |
| The form says Toyota Civic. That is what the seller sent me. | Civic; Honda; preserve the valid model candidate. |
| I drive a Dart and the hood has faded. | Exact Dart remains Dart; fuzzy matching must not change a valid model into another model. |

## User-supplied real regression

Provenance: `user-provided-real-anonymized`. The user supplied this excerpt in the task. Expected model: `4Runner`; possible makes: `[Toyota]`; observed model evidence: `4runner`.

> Hi, I've had my 4runner for 6months now and I'm already seeing pinstripes from branches and small rocks popping up into the body, and also dings on the front. I'm asking a few shops for a perspective on the best way to take care of the paint for years to come. Also worth noting the car lives outside 100% of the time, no garage. Feel free to call or text. Thanks!

## Small fixture contract proposal

Use a stable case ID, one primary category, provenance, the complete message text, and expected model mentions with model, complete possible-make set, and literal source evidence. Include a short reason only when intent or ambiguity needs explanation. Derive expected `findMakes` from the human-authored model labels. Repeated mentions need an occurrence index or explicit offsets.

The runner should compare mention order, expected model identities, complete make sets, and original-text spans. JavaScript offsets use UTF-16 code units. Tests should check that `text.slice(start, end)` equals the reported raw text, including after emoji, combining marks, and normalization. Sort make sets for comparison only when public ordering is unspecified.

A generic family mention remains at the family level. Exact full source models retain their complete names. Shared names retain every compatible make unless explicit local evidence disambiguates under the frozen contract. A conflicting make must never relabel a model to a make that does not manufacture it.

## Generated coverage and mutation rules

Generate catalog smoke cases deterministically from the pinned catalog using explicit `make model` phrasing. This validates data reach independently of real-language precision. Keep the expected catalog relation traceable to the pinned source. Missing source entries stay documented as source coverage gaps.

Generated invariants may vary case, approved separator forms, surrounding punctuation, leading emoji, and harmless prefix text. Check unchanged identities, exact span shifts, deterministic output, and deduplicated `findMakes`. Apply only transformations the public contract supports.

Typos in the authored corpus are chosen deliberately. Arbitrary deletion, insertion, or substitution can create a different valid vehicle name, ordinary word, or ambiguous neighbor. Such a mutation cannot inherit the original label automatically. Exact valid names take precedence over any mutation origin. Numeric tokens and very short names need dedicated boundary cases.

## Evaluation and leakage controls

Freeze authored text and labels before the first parser run. Record failures as parser/contract issues; label corrections require a written semantic reason. Never bulk-update expected values from parser output.

Report authored exact-case pass rate and positive/negative counts by category, alongside the real example's individual result. Calculate mention-level precision/recall only against the labeled corpus and state its provenance. A high generated coverage count cannot establish historical lead accuracy.

Future development/evaluation splits should keep messages from the same scenario or template together. Rephrasing a development message does not create an independent holdout. Keep unseen typo families and negative scenarios together by group. The initial visible acceptance suite is development evidence and has no private holdout claim.

Performance checks use a reproducible typical-message batch, long negative text, repeated common words, and bounded adversarial input. Prefer invariant/work-bound checks and report measured timing with Node version and machine context. Avoid tight wall-clock assertions in ordinary CI.

## Contract decisions requested from main

Confirmed by the frozen PRD: model-only output, `findMakes` as their sorted union, matching make context for numeric models, clear vehicle context for ordinary words, repeated occurrences in source order, exact full model preference, valid catalog candidates preserved through contradictions, and UTF-16 model-portion spans. Output fields are `model`, `makes`, `matchedText`, `start`, `end`, and `matchType`. Normalized source-label collisions preserve all original candidates. Text is fully scanned without silent truncation.

## Authored scenario inventory

The following 180 scenarios are original synthetic text. Semicolons separate vehicle occurrences in source order. Bracketed make sets preserve ambiguity. Source spellings are provisional only where a family alias needs the final PRD. The sentinel table above contains design examples and does not increase the case count. This inventory is the pre-execution label record.

### Canonical inquiries: 30

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| c01 | My 4Runner has trail scratches on both doors. Can those be polished out? | 4Runner / Toyota |
| c02 | I spilled a smoothie in the Civic yesterday. How soon could you clean the seats? | Civic / Honda |
| c03 | Looking for a two step correction on my Outback before I sell it. | Outback / Subaru |
| c04 | Is ceramic coating useful on a Camry that stays outside year round? | Camry / Toyota |
| c05 | The Corolla has tree sap across the roof after a week at camp. | Corolla / Toyota |
| c06 | Can I drop off the RAV4 on Thursday evening for tint? | RAV4 / Toyota |
| c07 | We just bought a Sienna and the kids already tracked mud inside. | Sienna / Toyota |
| c08 | My Highlander has water spots that survive every wash. | Highlander / Toyota |
| c09 | Need the dog hair removed from an Accord before our road trip. | Accord / Honda |
| c10 | How much for both front windows on a CR-V? | CR-V / Honda |
| c11 | Our Odyssey smells damp after the rear window was left open. | Odyssey / Honda |
| c12 | There is overspray on my Honda Pilot from the fence next door. | Pilot / Honda |
| c13 | My Ford Focus has cloudy headlights. Do you restore those? | Focus / Ford |
| c14 | Looking to remove dealership stickers from a Ford Edge. | Edge / Ford |
| c15 | My Mustang only comes out on weekends. What protection makes sense? | Mustang / Ford |
| c16 | Need a quote for full front film on the Bronco. | Bronco / Ford |
| c17 | The Explorer has dried sunscreen on the passenger seat. | Explorer / Ford |
| c18 | I picked up a Wrangler with pinstripes all along the passenger side. | Wrangler / Jeep |
| c19 | Can you detail the interior of a Grand Cherokee with the child seats removed? | Grand Cherokee / Jeep |
| c20 | My Jeep Compass needs the roof polished where the rack sat. | Compass / Jeep |
| c21 | Would you quote a Tahoe with three rows and a lot of pet hair? | Tahoe / Chevrolet |
| c22 | The Suburban barely clears our garage. Is your bay tall enough? | Suburban / Chevrolet |
| c23 | My Corvette has a bird dropping mark in the clear coat. | Corvette / Chevrolet |
| c24 | The Camaro is wrapped already. Can you wash it by hand? | Camaro / Chevrolet |
| c25 | Could the CX-5 be ready by school pickup if I bring it at opening? | CX-5 / MAZDA |
| c26 | I need the salt cleaned out of the Forester carpets. | Forester / Subaru |
| c27 | Can you protect the new paint on my Porsche Macan? | Macan / Porsche |
| c28 | Is a one stage polish enough for this Volvo XC90? | XC90 / Volvo |
| c29 | Our Kia Telluride has sticky residue where a window decal was. | Telluride / Kia |
| c30 | I am collecting a Rivian R1S next week and would like film fitted. | R1S / Rivian |

### Formatting and aliases: 20

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| a01 | got a 4 runner with some branch marks, could you have a look? | 4Runner / Toyota |
| a02 | Need a wash for the 4RUNNER after a muddy weekend. | 4Runner / Toyota |
| a03 | Could you quote my 4-runner for paint correction? | 4Runner / Toyota |
| a04 | My f150 needs the hood polished where the cover rubbed. | F-150 family / Ford |
| a05 | Are you able to clean the cloth seats in an F-150? | F-150 family / Ford |
| a06 | Would my Ford F 150 fit in your shop with the rack on? | F-150 family / Ford |
| a07 | The cx5 has scuffs from loading a stroller. | CX-5 / MAZDA |
| a08 | Looking for window film for my Mazda cx 5. | CX-5 / MAZDA |
| a09 | Can my CX-5 stay overnight while the coating cures? | CX-5 / MAZDA |
| a10 | My chevy Tahoe has a hazy hood and roof. | Tahoe / Chevrolet |
| a11 | I bought a Chevy Silverado and would like the truck detailed. | Silverado family / Chevrolet |
| a12 | Any openings to tint a VW Jetta this week? | Jetta / Volkswagen |
| a13 | Need the front of the crv protected before a gravel trip. | CR-V / Honda |
| a14 | My honda cr v has stubborn marks around the door handles. | CR-V / Honda |
| a15 | Can I get an estimate for my rav 4 after you see the paint? | RAV4 / Toyota |
| a16 | We need the dog smell removed from a RAV-4. | RAV4 / Toyota |
| a17 | please price a wash and vacuum for the model3 | Model 3 / Tesla |
| a18 | Our MODEL Y needs the rear windows cleaned under the seals. | Model Y / Tesla |
| a19 | The Subaru outBACK has sand in every seat track. | Outback / Subaru |
| a20 | My Toyota 4Runner's hood is peppered with tiny chips. | 4Runner / Toyota |

### Deliberate realistic typos: 15

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| t01 | My chevy silverdo has scratches beside the tailgate. | Silverado family / Chevrolet |
| t02 | Can you remove coffee from the seats in my camery? | Camry / Toyota |
| t03 | Need a full detail for my Jeep wranger after the trail ride. | Wrangler / Jeep |
| t04 | The Toyota corrola has dried wax around the badges. | Corolla / Toyota |
| t05 | My Subaru forrester needs the dog hair cleaned out. | Forester / Subaru |
| t06 | I bought a highlnder with a dull spot on the rear quarter. | Highlander / Toyota |
| t07 | Can a hyundai elntra be dropped off before you open? | Elantra / Hyundai |
| t08 | Need pricing to coat a Nissan pathfnder. | Pathfinder / Nissan |
| t09 | The chevy equnox has overspray on both mirrors. | Equinox / Chevrolet |
| t10 | Looking for headlight restoration on my Ford mustng. | Mustang / Ford |
| t11 | My volvo xc90 has crumbs under every seat. | XC90 / Volvo; valid spelling remains exact |
| t12 | My Sienna needs a wash after the school camping trip. | Sienna / Toyota; valid spelling remains exact |
| t13 | The Sierra truck has fresh paint on the bed sides. | Sierra family / GMC; valid neighbor remains Sierra |
| t14 | Can you price film for a Jeep cherokee with aftermarket bumpers? | Cherokee / Jeep; valid shorter model remains exact |
| t15 | My toyota tacmoa has bug marks all over the hood. | Tacoma family / Toyota |

### Hard negatives: 55

| ID | Original message | Expected |
| --- | --- | --- |
| n01 | Please focus on the wheels when you clean the car. | [] |
| n02 | My focus is on paint protection that survives winter. | [] |
| n03 | Can the photos focus on the scratched panel? | [] |
| n04 | We should focus on cleaning before discussing a wrap. | [] |
| n05 | The camera lost focus while I was photographing the bumper. | [] |
| n06 | Can you fit my car in before lunch? | [] |
| n07 | The child seat is a tight fit after the upholstery repair. | [] |
| n08 | I need the cover to fit without rubbing the paint. | [] |
| n09 | Is the coating a good fit for someone who parks outdoors? | [] |
| n10 | Will a large van fit under your awning? | [] |
| n11 | The edge of the film keeps catching dirt. | [] |
| n12 | There is a scratch along the edge of the hood. | [] |
| n13 | Please leave a clean edge around the window sticker. | [] |
| n14 | The sharp edge on the shelf caught my door. | [] |
| n15 | Can you wrap right to the edge of the panel? | [] |
| n16 | I left a compass on the dashboard before dropping the car off. | [] |
| n17 | The compass app on my phone stopped working during the drive. | [] |
| n18 | Do you clean around the little compass mounted beside the mirror? | [] |
| n19 | I'm a pilot and need a lift back to the airport after drop-off. | [] |
| n20 | Our pilot delayed the flight so I can collect the car tomorrow. | [] |
| n21 | I pilot a small boat and need salt removed from its seats. | [] |
| n22 | There is air trapped under the film on the hood. | [] |
| n23 | Do you replace the air filter during an interior clean? | [] |
| n24 | A leaf got stuck under the wiper and stained the glass. | [] |
| n25 | My battery charger was left in the trunk. Please keep it there. | [] |
| n26 | Is there an extra charge for collecting the car? | [] |
| n27 | The cleaner left an orange accent around the stitched seams. | [] |
| n28 | I hear an echo when I call from the empty garage. | [] |
| n29 | We have reached an accord about paying for the damage. | [] |
| n30 | I hope the detail helps us escape the damp smell. | [] |
| n31 | The keys are in the little cube beside the office door. | [] |
| n32 | Cleaning this car has become quite a journey. | [] |
| n33 | There is neon lettering on the wrap that needs replacing. | [] |
| n34 | My son left his toy viper on the back seat. | [] |
| n35 | I can offer insight into how the staining happened. | [] |
| n36 | Please take my passport out of the glove box before washing. | [] |
| n37 | We booked the venue and now need the wedding car cleaned. | [] |
| n38 | That wax brand has a good legacy in our family. | [] |
| n39 | The sign says express service but I have time for a full clean. | [] |
| n40 | I would like a grand total including the roof treatment. | [] |
| n41 | The truck has a dent from a ram on the farm. | [] |
| n42 | It would be smart to clean the seats before the baby arrives. | [] |
| n43 | Could you do a mini interior clean during my lunch break? | [] |
| n44 | The car is an import and the manual is in another language. | [] |
| n45 | The quote includes 1500 for film and 300 for preparation. | [] |
| n46 | Call 208-555-0150 after 4 and ask about invoice 2024. | [] |
| n47 | I have a Toyota and need the paint inspected. | [] |
| n48 | Can you send ceramic coating prices for my Chevy? | [] |
| n49 | We drive a BMW and would like a wash this weekend. | [] |
| n50 | My next car may be a Honda. I am only asking about general pricing. | [] |
| n51 | Do you offer a discount to members of the Ford owners club? | [] |
| n52 | focus fit edge compass pilot | [] |
| n53 | IS this the right number for detailing? | [] |
| n54 | Order reference abc4runnerxyz is printed above the barcode. | [] |
| n55 | My booking code is xc9000 and the amount due is 9110. | [] |

### Multiple and repeated occurrences: 10

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| m01 | My Civic and my Outback both need the interiors cleaned. | Civic / Honda; Outback / Subaru |
| m02 | We need quotes for a Camry, a Corolla, and a RAV4. | Camry / Toyota; Corolla / Toyota; RAV4 / Toyota |
| m03 | The Tahoe is mine and the CX-5 is my partner's. Can we drop both off? | Tahoe / Chevrolet; CX-5 / MAZDA |
| m04 | I sold the Mustang and bought a Bronco. What would film cost for each? | Mustang / Ford; Bronco / Ford |
| m05 | The Civic needs a wash. The Civic also has a stain under the rear mat. | Civic / Honda; Civic / Honda |
| m06 | We have a 4Runner for camping and a Model 3 for commuting. | 4Runner / Toyota; Model 3 / Tesla |
| m07 | Can you fit my Honda Fit in before lunch? | Fit / Honda; only the model occurrence |
| m08 | The edge of the wrap on my Ford Edge is lifting. | Edge / Ford; only the model occurrence |
| m09 | The compass display in my Jeep Compass is dim. | Compass / Jeep; only the model occurrence |
| m10 | I'm a pilot and the Honda Pilot needs a deep clean. | Pilot / Honda; only the model occurrence |

### Ambiguity and contradictions: 12

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| b01 | I own a Continental and want the leather cleaned. | Continental / [Bentley, Lincoln] |
| b02 | My Bentley Continental needs the roof washed carefully. | Continental / Bentley |
| b03 | The Lincoln Continental has a scratch from a parking barrier. | Continental / Lincoln |
| b04 | Our Voyager needs the rear seats shampooed. | Voyager / [Chrysler, Plymouth] |
| b05 | Can you restore the headlights on my Plymouth Voyager? | Voyager / Plymouth |
| b06 | My Chrysler Voyager has cloudy plastic trim. | Voyager / Chrysler |
| b07 | My Neon has peeling tint on both back windows. | Neon / [Dodge, Plymouth] |
| b08 | Can you clean a Lexus LS while I wait nearby? | LS / Lexus |
| b09 | The form says Toyota Civic. That is what the seller sent me. | Civic / Honda |
| b10 | I typed Honda Camry on the request by mistake. Please quote the paintwork. | Camry / Toyota |
| b11 | My Ford Wrangler needs a full detail according to the note my son left. | Wrangler / Jeep |
| b12 | Can you quote a Toyota Continental for ceramic coating? That is all the advert says. | Continental / [Bentley, Lincoln] |

### Specificity and overlap: 12

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| s01 | My Bronco Sport needs film on the hood and both mirrors. | Bronco Sport / Ford |
| s02 | Can the Grand Cherokee L be detailed with all three rows up? | Grand Cherokee L / Jeep |
| s03 | My RAV4 Prime has road tar behind the front wheels. | RAV4 Prime / Toyota |
| s04 | The Corolla Cross Hybrid needs the rear windows tinted. | Corolla Cross Hybrid / Toyota |
| s05 | Please quote the Grand Highlander Hybrid for full front film. | Grand Highlander Hybrid / Toyota |
| s06 | Do you have room for a Silverado 1500 Crew Cab with a roof rack? | Silverado 1500 Crew Cab / Chevrolet |
| s07 | The Silverado 2500 HD Double Cab has water spots across the bed. | Silverado 2500 HD Double Cab / Chevrolet |
| s08 | I need an estimate for an Escalade ESV with very dirty carpets. | Escalade ESV / Cadillac |
| s09 | Would the Range Rover Sport need a different coating on the black trim? | Range Rover Sport / Land Rover |
| s10 | My Mustang MACH-E has a chip on the painted nose. | Mustang MACH-E / Ford |
| s11 | Please price a Civic Type R for film before the next track day. | Civic Type R / Honda |
| s12 | The CX-90 PHEV is arriving next week and I want it booked in. | CX-90 PHEV / MAZDA |

### Numbers and token boundaries: 10

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| z01 | The 2017 Camry has 150000 miles and the callback number is 208-555-0117. | Camry / Toyota |
| z02 | Can you quote film for my Porsche 911? | 911 / Porsche |
| z03 | I have a Polestar 2 with a chipped hood. | 2 / Polestar |
| z04 | My Mazda 626 needs the carpets cleaned after a spill. | 626 / MAZDA |
| z05 | The 2024 BMW M3 has brake dust that will not wash off. | M3 / BMW |
| z06 | I paid 911 for the first job and 626 for the second. | [] |
| z07 | Please call 555-0202 about booking number 1500 at 4pm. | [] |
| z08 | The vehicle is a Camry; the paint code is 040 and the year is 2012. | Camry / Toyota |
| z09 | My username is mycivic2020 and my reference is model3000. | [] |
| z10 | Can my A4 be finished by 3? The key tag says Audi. | A4 / Audi |

### Unicode and text shape: 10

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| u01 | 🚙 My 4Runner has sap on the roof. Is that removable? | 4Runner / Toyota; UTF-16 offset includes the emoji |
| u02 | My wife’s Civic needs the seats cleaned before Friday. | Civic / Honda |
| u03 | Can you quote my CX‑5 for film? | CX-5 / MAZDA; nonbreaking hyphen U+2011 |
| u04 | The RAV 4 has a coffee stain on the passenger seat. | RAV4 / Toyota; nonbreaking space U+00A0 |
| u05 | Café pickup first, then I can bring the Outback for a wash. | Outback / Subaru |
| u06 | 🚗✨ The model 3 has bugs across the bumper. | Model 3 / Tesla |
| u07 | [Empty string.] | [] |
| u08 | [Spaces, a tab, CRLF, and a trailing newline only.] | [] |
| u09 | [Three lines: Hello; My 4Runner needs a wash.; Thanks.] | 4Runner / Toyota; preserve CRLF offsets |
| u10 | [400 repetitions of: Please clean the seats and remove the dust. Then: My Civic has a stain under the rear mat.] | Civic / Honda; model at the end of long text |

### Additional boundary regressions: 6

| ID | Original message | Expected model / possible makes |
| --- | --- | --- |
| r01 | Camry | Camry / Toyota |
| r02 | (4Runner) | 4Runner / Toyota |
| r03 | My car is a Honda Fit. Please focus on the seat stains. | Fit / Honda |
| r04 | We have a Wrangler 4xe and a Wrangler. Please quote both. | Wrangler 4xe / Jeep; Wrangler / Jeep |
| r05 | My Toyota Camry and Honda Civic both need paint inspection. | Camry / Toyota; Civic / Honda |
| r06 | I have a Ford Focus. My focus is keeping the new coating clean. | Focus / Ford; only the model occurrence |

## Primary-source observations

- Selected source: <https://github.com/abhionlyone/us-car-models-data>. Its README currently describes the free data as historical and says future free updates have stopped. Accessed 2026-09-17.
- Inspected source: <https://raw.githubusercontent.com/abhionlyone/us-car-models-data/master/2024.csv>. Header: `year,make,model,body_styles`. Rows distinguish `Bronco Sport`, `Grand Cherokee L`, `RAV4 Prime`, and cab-specific Silverado models. The make field includes source spellings such as `MAZDA` and `INFINITI`. Mutable source links here are research references; the build owner will select the pinned identity.
- Inspected older source: <https://raw.githubusercontent.com/abhionlyone/us-car-models-data/master/2010.csv>. Older rows contain body-style arrays encoded in CSV cells, and preserve full cab names in the model field.

The researcher owns final source counts, collision verification, licensing, and reproducible dataset-build recommendations. This plan makes no independent comprehensive-year-coverage claim.
