import type { CorpusCase } from './types.js';

// Labels were written before executing the parser. See docs/corpus-plan.md.
// Evidence is literal original text. The optional occurrence is zero-based.
type Label = [model: string, makes: string[], evidence: string, occurrence?: number];
type Definition = [id: string, text: string, labels?: Label[]];

function define(category: string, definitions: Definition[]): CorpusCase[] {
  return definitions.map(([id, text, labels = []]) => ({
    id,
    category,
    provenance: 'hand-authored-synthetic',
    text,
    expected: labels.map(([model, makes, matchedText, occurrence = 0]) => {
      let start = -1;
      for (let index = 0; index <= occurrence; index++) {
        start = text.indexOf(matchedText, start + 1);
        if (start < 0) throw new Error(`${id}: missing authored evidence ${matchedText}`);
      }
      return { model, makes: [...makes].sort(), matchedText, start, end: start + matchedText.length };
    }),
  }));
}

export const authoredCases: CorpusCase[] = [
  ...define('canonical', [
    [
      'c01',
      'My 4Runner has trail scratches on both doors. Can those be polished out?',
      [['4Runner', ['Toyota'], '4Runner']],
    ],
    [
      'c02',
      'I spilled a smoothie in the Civic yesterday. How soon could you clean the seats?',
      [['Civic', ['Honda'], 'Civic']],
    ],
    ['c03', 'Looking for a two step correction on my Outback before I sell it.', [['Outback', ['Subaru'], 'Outback']]],
    ['c04', 'Is ceramic coating useful on a Camry that stays outside year round?', [['Camry', ['Toyota'], 'Camry']]],
    ['c05', 'The Corolla has tree sap across the roof after a week at camp.', [['Corolla', ['Toyota'], 'Corolla']]],
    ['c06', 'Can I drop off the RAV4 on Thursday evening for tint?', [['RAV4', ['Toyota'], 'RAV4']]],
    ['c07', 'We just bought a Sienna and the kids already tracked mud inside.', [['Sienna', ['Toyota'], 'Sienna']]],
    ['c08', 'My Highlander has water spots that survive every wash.', [['Highlander', ['Toyota'], 'Highlander']]],
    ['c09', 'Need the dog hair removed from an Accord before our road trip.', [['Accord', ['Honda'], 'Accord']]],
    ['c10', 'How much for both front windows on a CR-V?', [['CR-V', ['Honda'], 'CR-V']]],
    ['c11', 'Our Odyssey smells damp after the rear window was left open.', [['Odyssey', ['Honda'], 'Odyssey']]],
    ['c12', 'There is overspray on my Honda Pilot from the fence next door.', [['Pilot', ['Honda'], 'Pilot']]],
    ['c13', 'My Ford Focus has cloudy headlights. Do you restore those?', [['Focus', ['Ford'], 'Focus']]],
    ['c14', 'Looking to remove dealership stickers from a Ford Edge.', [['Edge', ['Ford'], 'Edge']]],
    ['c15', 'My Mustang only comes out on weekends. What protection makes sense?', [['Mustang', ['Ford'], 'Mustang']]],
    ['c16', 'Need a quote for full front film on the Bronco.', [['Bronco', ['Ford'], 'Bronco']]],
    ['c17', 'The Explorer has dried sunscreen on the passenger seat.', [['Explorer', ['Ford'], 'Explorer']]],
    [
      'c18',
      'I picked up a Wrangler with pinstripes all along the passenger side.',
      [['Wrangler', ['Jeep'], 'Wrangler']],
    ],
    [
      'c19',
      'Can you detail the interior of a Grand Cherokee with the child seats removed?',
      [['Grand Cherokee', ['Jeep'], 'Grand Cherokee']],
    ],
    ['c20', 'My Jeep Compass needs the roof polished where the rack sat.', [['Compass', ['Jeep'], 'Compass']]],
    ['c21', 'Would you quote a Tahoe with three rows and a lot of pet hair?', [['Tahoe', ['Chevrolet'], 'Tahoe']]],
    [
      'c22',
      'The Suburban barely clears our garage. Is your bay tall enough?',
      [['Suburban', ['Chevrolet'], 'Suburban']],
    ],
    ['c23', 'My Corvette has a bird dropping mark in the clear coat.', [['Corvette', ['Chevrolet'], 'Corvette']]],
    ['c24', 'The Camaro is wrapped already. Can you wash it by hand?', [['Camaro', ['Chevrolet'], 'Camaro']]],
    ['c25', 'Could the CX-5 be ready by school pickup if I bring it at opening?', [['CX-5', ['MAZDA'], 'CX-5']]],
    ['c26', 'I need the salt cleaned out of the Forester carpets.', [['Forester', ['Subaru'], 'Forester']]],
    ['c27', 'Can you protect the new paint on my Porsche Macan?', [['Macan', ['Porsche'], 'Macan']]],
    ['c28', 'Is a one stage polish enough for this Volvo XC90?', [['XC90', ['Volvo'], 'XC90']]],
    ['c29', 'Our Kia Telluride has sticky residue where a window decal was.', [['Telluride', ['Kia'], 'Telluride']]],
    ['c30', 'I am collecting a Rivian R1S next week and would like film fitted.', [['R1S', ['Rivian'], 'R1S']]],
  ]),
  ...define('aliases', [
    ['a01', 'got a 4 runner with some branch marks, could you have a look?', [['4Runner', ['Toyota'], '4 runner']]],
    ['a02', 'Need a wash for the 4RUNNER after a muddy weekend.', [['4Runner', ['Toyota'], '4RUNNER']]],
    ['a03', 'Could you quote my 4-runner for paint correction?', [['4Runner', ['Toyota'], '4-runner']]],
    ['a04', 'My f150 needs the hood polished where the cover rubbed.', [['F-150', ['Ford'], 'f150']]],
    ['a05', 'Are you able to clean the cloth seats in an F-150?', [['F-150', ['Ford'], 'F-150']]],
    ['a06', 'Would my Ford F 150 fit in your shop with the rack on?', [['F-150', ['Ford'], 'F 150']]],
    ['a07', 'The cx5 has scuffs from loading a stroller.', [['CX-5', ['MAZDA'], 'cx5']]],
    ['a08', 'Looking for window film for my Mazda cx 5.', [['CX-5', ['MAZDA'], 'cx 5']]],
    ['a09', 'Can my CX-5 stay overnight while the coating cures?', [['CX-5', ['MAZDA'], 'CX-5']]],
    ['a10', 'My chevy Tahoe has a hazy hood and roof.', [['Tahoe', ['Chevrolet'], 'Tahoe']]],
    [
      'a11',
      'I bought a Chevy Silverado and would like the truck detailed.',
      [['Silverado', ['Chevrolet'], 'Silverado']],
    ],
    ['a12', 'Any openings to tint a VW Jetta this week?', [['Jetta', ['Volkswagen'], 'Jetta']]],
    ['a13', 'Need the front of the crv protected before a gravel trip.', [['CR-V', ['Honda'], 'crv']]],
    ['a14', 'My honda cr v has stubborn marks around the door handles.', [['CR-V', ['Honda'], 'cr v']]],
    ['a15', 'Can I get an estimate for my rav 4 after you see the paint?', [['RAV4', ['Toyota'], 'rav 4']]],
    ['a16', 'We need the dog smell removed from a RAV-4.', [['RAV4', ['Toyota'], 'RAV-4']]],
    ['a17', 'please price a wash and vacuum for the model3', [['Model 3', ['Tesla'], 'model3']]],
    ['a18', 'Our MODEL Y needs the rear windows cleaned under the seals.', [['Model Y', ['Tesla'], 'MODEL Y']]],
    ['a19', 'The Subaru outBACK has sand in every seat track.', [['Outback', ['Subaru'], 'outBACK']]],
    ['a20', "My Toyota 4Runner's hood is peppered with tiny chips.", [['4Runner', ['Toyota'], '4Runner']]],
  ]),
  ...define('typos-and-valid-neighbors', [
    ['t01', 'My chevy silverdo has scratches beside the tailgate.', [['Silverado', ['Chevrolet'], 'silverdo']]],
    ['t02', 'Can you remove coffee from the seats in my camery?', [['Camry', ['Toyota'], 'camery']]],
    ['t03', 'Need a full detail for my Jeep wranger after the trail ride.', [['Wrangler', ['Jeep'], 'wranger']]],
    ['t04', 'The Toyota corrola has dried wax around the badges.', [['Corolla', ['Toyota'], 'corrola']]],
    ['t05', 'My Subaru forrester needs the dog hair cleaned out.', [['Forester', ['Subaru'], 'forrester']]],
    ['t06', 'I bought a highlnder with a dull spot on the rear quarter.', [['Highlander', ['Toyota'], 'highlnder']]],
    ['t07', 'Can a hyundai elntra be dropped off before you open?', [['Elantra', ['Hyundai'], 'elntra']]],
    ['t08', 'Need pricing to coat a Nissan pathfnder.', [['Pathfinder', ['Nissan'], 'pathfnder']]],
    ['t09', 'The chevy equnox has overspray on both mirrors.', [['Equinox', ['Chevrolet'], 'equnox']]],
    ['t10', 'Looking for headlight restoration on my Ford mustng.', [['Mustang', ['Ford'], 'mustng']]],
    ['t11', 'My volvo xc90 has crumbs under every seat.', [['XC90', ['Volvo'], 'xc90']]],
    ['t12', 'My Sienna needs a wash after the school camping trip.', [['Sienna', ['Toyota'], 'Sienna']]],
    ['t13', 'The Sierra truck has fresh paint on the bed sides.', [['Sierra', ['GMC'], 'Sierra']]],
    ['t14', 'Can you price film for a Jeep cherokee with aftermarket bumpers?', [['Cherokee', ['Jeep'], 'cherokee']]],
    ['t15', 'My toyota tacmoa has bug marks all over the hood.', [['Tacoma', ['Toyota'], 'tacmoa']]],
  ]),
  ...define('hard-negatives', [
    ['n01', 'Please focus on the wheels when you clean the car.'],
    ['n02', 'My focus is on paint protection that survives winter.'],
    ['n03', 'Can the photos focus on the scratched panel?'],
    ['n04', 'We should focus on cleaning before discussing a wrap.'],
    ['n05', 'The camera lost focus while I was photographing the bumper.'],
    ['n06', 'Can you fit my car in before lunch?'],
    ['n07', 'The child seat is a tight fit after the upholstery repair.'],
    ['n08', 'I need the cover to fit without rubbing the paint.'],
    ['n09', 'Is the coating a good fit for someone who parks outdoors?'],
    ['n10', 'Will a large van fit under your awning?'],
    ['n11', 'The edge of the film keeps catching dirt.'],
    ['n12', 'There is a scratch along the edge of the hood.'],
    ['n13', 'Please leave a clean edge around the window sticker.'],
    ['n14', 'The sharp edge on the shelf caught my door.'],
    ['n15', 'Can you wrap right to the edge of the panel?'],
    ['n16', 'I left a compass on the dashboard before dropping the car off.'],
    ['n17', 'The compass app on my phone stopped working during the drive.'],
    ['n18', 'Do you clean around the little compass mounted beside the mirror?'],
    ['n19', "I'm a pilot and need a lift back to the airport after drop-off."],
    ['n20', 'Our pilot delayed the flight so I can collect the car tomorrow.'],
    ['n21', 'I pilot a small boat and need salt removed from its seats.'],
    ['n22', 'There is air trapped under the film on the hood.'],
    ['n23', 'Do you replace the air filter during an interior clean?'],
    ['n24', 'A leaf got stuck under the wiper and stained the glass.'],
    ['n25', 'My battery charger was left in the trunk.'],
    ['n26', 'Is there an extra charge for collecting the car?'],
    ['n27', 'The cleaner left an orange accent around the stitched seams.'],
    ['n28', 'I hear an echo when I call from the empty garage.'],
    ['n29', 'We have reached an accord about paying for the damage.'],
    ['n30', 'I hope the detail helps us escape the damp smell.'],
    ['n31', 'The keys are in the little cube beside the office door.'],
    ['n32', 'Cleaning this car has become quite a journey.'],
    ['n33', 'There is neon lettering on the wrap that needs replacing.'],
    ['n34', 'My son left his toy viper on the back seat.'],
    ['n35', 'I can offer insight into how the staining happened.'],
    ['n36', 'Please take my passport out of the glove box before washing.'],
    ['n37', 'We booked the venue and now need the wedding car cleaned.'],
    ['n38', 'That wax brand has a good legacy in our family.'],
    ['n39', 'The sign says express service but I have time for a full clean.'],
    ['n40', 'I would like a grand total including the roof treatment.'],
    ['n41', 'The truck has a dent from a ram on the farm.'],
    ['n42', 'It would be smart to clean the seats before the baby arrives.'],
    ['n43', 'Could you do a mini interior clean during my lunch break?'],
    ['n44', 'The car is an import and the manual is in another language.'],
    ['n45', 'The quote includes 1500 for film and 300 for preparation.'],
    ['n46', 'Call 208-555-0150 after 4 and ask about invoice 2024.'],
    ['n47', 'I have a Toyota and need the paint inspected.'],
    ['n48', 'Can you send ceramic coating prices for my Chevy?'],
    ['n49', 'We drive a BMW and would like a wash this weekend.'],
    ['n50', 'My next car may be a Honda. I am only asking about general pricing.'],
    ['n51', 'Do you offer a discount to members of the Ford owners club?'],
    ['n52', 'focus fit edge compass pilot'],
    ['n53', 'IS this the right number for detailing?'],
    ['n54', 'Order reference abc4runnerxyz is printed above the barcode.'],
    ['n55', 'My booking code is xc9000 and the amount due is 9110.'],
  ]),
  ...define('multiple', [
    [
      'm01',
      'My Civic and my Outback both need the interiors cleaned.',
      [
        ['Civic', ['Honda'], 'Civic'],
        ['Outback', ['Subaru'], 'Outback'],
      ],
    ],
    [
      'm02',
      'We need quotes for a Camry, a Corolla, and a RAV4.',
      [
        ['Camry', ['Toyota'], 'Camry'],
        ['Corolla', ['Toyota'], 'Corolla'],
        ['RAV4', ['Toyota'], 'RAV4'],
      ],
    ],
    [
      'm03',
      "The Tahoe is mine and the CX-5 is my partner's. Can we drop both off?",
      [
        ['Tahoe', ['Chevrolet'], 'Tahoe'],
        ['CX-5', ['MAZDA'], 'CX-5'],
      ],
    ],
    [
      'm04',
      'I sold the Mustang and bought a Bronco. What would film cost for each?',
      [
        ['Mustang', ['Ford'], 'Mustang'],
        ['Bronco', ['Ford'], 'Bronco'],
      ],
    ],
    [
      'm05',
      'The Civic needs a wash. The Civic also has a stain under the rear mat.',
      [
        ['Civic', ['Honda'], 'Civic'],
        ['Civic', ['Honda'], 'Civic', 1],
      ],
    ],
    [
      'm06',
      'We have a 4Runner for camping and a Model 3 for commuting.',
      [
        ['4Runner', ['Toyota'], '4Runner'],
        ['Model 3', ['Tesla'], 'Model 3'],
      ],
    ],
    ['m07', 'Can you fit my Honda Fit in before lunch?', [['Fit', ['Honda'], 'Fit']]],
    ['m08', 'The edge of the wrap on my Ford Edge is lifting.', [['Edge', ['Ford'], 'Edge']]],
    ['m09', 'The compass display in my Jeep Compass is dim.', [['Compass', ['Jeep'], 'Compass']]],
    ['m10', "I'm a pilot and the Honda Pilot needs a deep clean.", [['Pilot', ['Honda'], 'Pilot']]],
  ]),
  ...define('ambiguity-and-contradictions', [
    [
      'b01',
      'I own a Continental and want the leather cleaned.',
      [['Continental', ['Bentley', 'Lincoln'], 'Continental']],
    ],
    ['b02', 'My Bentley Continental needs the roof washed carefully.', [['Continental', ['Bentley'], 'Continental']]],
    [
      'b03',
      'The Lincoln Continental has a scratch from a parking barrier.',
      [['Continental', ['Lincoln'], 'Continental']],
    ],
    ['b04', 'Our Voyager needs the rear seats shampooed.', [['Voyager', ['Chrysler', 'Plymouth'], 'Voyager']]],
    ['b05', 'Can you restore the headlights on my Plymouth Voyager?', [['Voyager', ['Plymouth'], 'Voyager']]],
    ['b06', 'My Chrysler Voyager has cloudy plastic trim.', [['Voyager', ['Chrysler'], 'Voyager']]],
    ['b07', 'My Neon has peeling tint on both back windows.', [['Neon', ['Dodge', 'Plymouth'], 'Neon']]],
    ['b08', 'Can you clean a Lexus LS while I wait nearby?', [['LS', ['Lexus'], 'LS']]],
    ['b09', 'The form says Toyota Civic. That is what the seller sent me.', [['Civic', ['Honda'], 'Civic']]],
    [
      'b10',
      'I typed Honda Camry on the request by mistake. Please quote the paintwork.',
      [['Camry', ['Toyota'], 'Camry']],
    ],
    [
      'b11',
      'My Ford Wrangler needs a full detail according to the note my son left.',
      [['Wrangler', ['Jeep'], 'Wrangler']],
    ],
    [
      'b12',
      'Can you quote a Toyota Continental for ceramic coating? That is all the advert says.',
      [['Continental', ['Bentley', 'Lincoln'], 'Continental']],
    ],
  ]),
  ...define('specificity', [
    ['s01', 'My Bronco Sport needs film on the hood and both mirrors.', [['Bronco Sport', ['Ford'], 'Bronco Sport']]],
    [
      's02',
      'Can the Grand Cherokee L be detailed with all three rows up?',
      [['Grand Cherokee L', ['Jeep'], 'Grand Cherokee L']],
    ],
    ['s03', 'My RAV4 Prime has road tar behind the front wheels.', [['RAV4 Prime', ['Toyota'], 'RAV4 Prime']]],
    [
      's04',
      'The Corolla Cross Hybrid needs the rear windows tinted.',
      [['Corolla Cross Hybrid', ['Toyota'], 'Corolla Cross Hybrid']],
    ],
    [
      's05',
      'Please quote the Grand Highlander Hybrid for full front film.',
      [['Grand Highlander Hybrid', ['Toyota'], 'Grand Highlander Hybrid']],
    ],
    [
      's06',
      'Do you have room for a Silverado 1500 Crew Cab with a roof rack?',
      [['Silverado 1500 Crew Cab', ['Chevrolet'], 'Silverado 1500 Crew Cab']],
    ],
    [
      's07',
      'The Silverado 2500 HD Double Cab has water spots across the bed.',
      [['Silverado 2500 HD Double Cab', ['Chevrolet'], 'Silverado 2500 HD Double Cab']],
    ],
    [
      's08',
      'I need an estimate for an Escalade ESV with very dirty carpets.',
      [['Escalade ESV', ['Cadillac'], 'Escalade ESV']],
    ],
    [
      's09',
      'Would the Range Rover Sport need a different coating on the black trim?',
      [['Range Rover Sport', ['Land Rover'], 'Range Rover Sport']],
    ],
    ['s10', 'My Mustang MACH-E has a chip on the painted nose.', [['Mustang MACH-E', ['Ford'], 'Mustang MACH-E']]],
    [
      's11',
      'Please price a Civic Type R for film before the next track day.',
      [['Civic Type R', ['Honda'], 'Civic Type R']],
    ],
    ['s12', 'The CX-90 PHEV is arriving next week and I want it booked in.', [['CX-90 PHEV', ['MAZDA'], 'CX-90 PHEV']]],
  ]),
  ...define('numbers-and-boundaries', [
    [
      'z01',
      'The 2017 Camry has 150000 miles and the callback number is 208-555-0117.',
      [['Camry', ['Toyota'], 'Camry']],
    ],
    ['z02', 'Can you quote film for my Porsche 911?', [['911', ['Porsche'], '911']]],
    ['z03', 'I have a Polestar 2 with a chipped hood.', [['2', ['Polestar'], '2']]],
    ['z04', 'My Mazda 626 needs the carpets cleaned after a spill.', [['626', ['MAZDA'], '626']]],
    ['z05', 'The 2024 BMW M3 has brake dust that will not wash off.', [['M3', ['BMW'], 'M3']]],
    ['z06', 'I paid 911 for the first job and 626 for the second.'],
    ['z07', 'Please call 555-0202 about booking number 1500 at 4pm.'],
    ['z08', 'The vehicle is a Camry; the paint code is 040 and the year is 2012.', [['Camry', ['Toyota'], 'Camry']]],
    ['z09', 'My username is mycivic2020 and my reference is model3000.'],
    ['z10', 'Can my A4 be finished by 3? The key tag says Audi.', [['A4', ['Audi'], 'A4']]],
  ]),
  ...define('unicode-and-shape', [
    ['u01', '🚙 My 4Runner has sap on the roof. Is that removable?', [['4Runner', ['Toyota'], '4Runner']]],
    ['u02', 'My wife’s Civic needs the seats cleaned before Friday.', [['Civic', ['Honda'], 'Civic']]],
    ['u03', 'Can you quote my CX‑5 for film?', [['CX-5', ['MAZDA'], 'CX‑5']]],
    ['u04', 'The RAV 4 has a coffee stain on the passenger seat.', [['RAV4', ['Toyota'], 'RAV 4']]],
    ['u05', 'Café pickup first, then I can bring the Outback for a wash.', [['Outback', ['Subaru'], 'Outback']]],
    ['u06', '🚗✨ The model 3 has bugs across the bumper.', [['Model 3', ['Tesla'], 'model 3']]],
    ['u07', ''],
    ['u08', '   \t\r\n\n'],
    ['u09', 'Hello\r\nMy 4Runner needs a wash.\r\nThanks.', [['4Runner', ['Toyota'], '4Runner']]],
    [
      'u10',
      'Please clean the seats and remove the dust. '.repeat(400) + 'My Civic has a stain under the rear mat.',
      [['Civic', ['Honda'], 'Civic']],
    ],
  ]),
  ...define('additional-regressions', [
    ['r01', 'Camry', [['Camry', ['Toyota'], 'Camry']]],
    ['r02', '(4Runner)', [['4Runner', ['Toyota'], '4Runner']]],
    ['r03', 'My car is a Honda Fit. Please focus on the seat stains.', [['Fit', ['Honda'], 'Fit']]],
    [
      'r04',
      'We have a Wrangler 4xe and a Wrangler. Please quote both.',
      [
        ['Wrangler 4xe', ['Jeep'], 'Wrangler 4xe'],
        ['Wrangler', ['Jeep'], 'Wrangler', 1],
      ],
    ],
    [
      'r05',
      'My Toyota Camry and Honda Civic both need paint inspection.',
      [
        ['Camry', ['Toyota'], 'Camry'],
        ['Civic', ['Honda'], 'Civic'],
      ],
    ],
    ['r06', 'I have a Ford Focus. My focus is keeping the new coating clean.', [['Focus', ['Ford'], 'Focus']]],
  ]),
  ...define('additional-source-boundaries', [
    ['x01', 'The upload link is https://example.invalid/Civic/4Runner?model=Camry.'],
    ['x02', 'Send the estimate to civic.4runner@example.invalid please.'],
    ['x03', 'My Subaru outbak has a stain on the rear bench.', [['Outback', ['Subaru'], 'outbak']]],
    [
      'x04',
      'My wranger has mud on the seats.',
      [
        ['Ranger', ['Ford'], 'wranger'],
        ['Wrangler', ['Jeep'], 'wranger'],
      ],
    ],
    ['x05', 'My Viper needs the front bumper polished.', [['Viper', ['Dodge', 'SRT'], 'Viper']]],
    ['x06', 'Please quote my SRT Viper for a careful hand wash.', [['Viper', ['SRT'], 'Viper']]],
    ['x07', 'My FIAT 500e has a stained seat.', [['500e', ['FIAT'], '500e']]],
    ['x08', 'Can you detail the Mercedes-Benz 500 E in our driveway?', [['500 E', ['Mercedes-Benz'], '500 E']]],
    [
      'x09',
      '🚐 My Honda Civic needs a wash; the photos are at https://example.invalid/4Runner.',
      [['Civic', ['Honda'], 'Civic']],
    ],
    ['x10', 'My ４Ｒｕｎｎｅｒ needs the paint cleaned.', [['4Runner', ['Toyota'], '４Ｒｕｎｎｅｒ']]],
    ['x11', 'Cafe\u0301 pickup is done. My Civic is ready for you.', [['Civic', ['Honda'], 'Civic']]],
    ['x12', '👩🏽‍🔧 Could my RAV4 be ready by Friday?', [['RAV4', ['Toyota'], 'RAV4']]],
    [
      'x13',
      'Can you wash a Ford F150 Regular Cab with a bed cover?',
      [['F150 Regular Cab', ['Ford'], 'F150 Regular Cab']],
    ],
    [
      'x14',
      'Our Mercedes-Benz Sprinter 2500 Cargo needs the floor cleaned.',
      [['Sprinter 2500 Cargo', ['Mercedes-Benz'], 'Sprinter 2500 Cargo']],
    ],
    [
      'x15',
      'My Sprinter 2500 Cargo needs old glue removed.',
      [['Sprinter 2500 Cargo', ['Dodge', 'Freightliner', 'Mercedes-Benz'], 'Sprinter 2500 Cargo']],
    ],
    [
      'x16',
      'Our Grand Voyager has marker on the rear seat.',
      [['Grand Voyager', ['Chrysler', 'Plymouth'], 'Grand Voyager']],
    ],
    ['x17', 'Could you quote the Civic?!', [['Civic', ['Honda'], 'Civic']]],
    ['x18', 'I drive a Civic. Please fit it in when you have time.', [['Civic', ['Honda'], 'Civic']]],
    ['x19', 'I own 2 cars and need an estimate for cleaning both.'],
    ['x20', 'My Toyota corola has scratches around the boot handle.', [['Corolla', ['Toyota'], 'corola']]],
  ]),
  // Added after independently checking the raw Porsche source spellings and
  // edit operations. This permanently records the generator-oracle correction.
  ...define('mutation-collision-regression', [
    [
      'x21',
      'My Porsche tacan needs the paint inspected.',
      [
        ['Macan', ['Porsche'], 'tacan'],
        ['Taycan', ['Porsche'], 'tacan'],
      ],
    ],
  ]),
];

const realText =
  "Hi, I've had my 4runner for 6months now and I'm already seeing pinstripes from branches and small rocks popping up into the body, and also dings on the front. I'm asking a few shops for a perspective on the best way to take care of the paint for years to come. Also worth noting the car lives outside 100% of the time, no garage. Feel free to call or text. Thanks!";

export const realCases: CorpusCase[] = define('real-message', [
  ['real-4runner-001', realText, [['4Runner', ['Toyota'], '4runner']]],
]).map((fixture) => ({ ...fixture, provenance: 'user-provided-real-anonymized' }));
