// Keys here use lowercase ASCII, matching the runtime's normalization.
export const makeAliases: Record<string, string> = {
  chevy: 'Chevrolet',
  vw: 'Volkswagen',
  mercedes: 'Mercedes-Benz',
  benz: 'Mercedes-Benz',
};

export const highRiskCommonModels = new Set(
  `
  accent accord air charge charger compass echo edge fit focus golf insight journey leaf
  legacy passport pilot soul venue cube
`
    .split(/\s+/)
    .filter(Boolean),
);

// These source names also have frequent ordinary meanings. Context is always local.
export const commonModels = new Set(
  `
  accent acclaim accord air alaska amigo armada ascent aspen aspire atlas aura aurora
  avalanche avenger aviator axiom azure baja beetle blackwood blazer breeze bronco
  caliber california canyon capri caravan carnival cavalier cayenne cayman century
  challenger charger charade cherokee cirrus classic cobalt colorado colt commander compass
  continental contour convertible cooper corsair corvette cougar countryman coupe crown
  cutlass dart dawn defender discovery dynasty echo eclipse edge element enclave encore
  endeavor entourage envision envoy equator equinox escape escort esteem excel excursion
  expedition explorer expo fiesta fit flex focus forester forte fox frontier freestyle
  fusion genesis ghost gladiator golf gravity highlander hornet hummer imperial impulse
  insight intrepid intrigue ion journey karma kicks kona lacrosse landcruiser laser leaf
  legacy legend liberty magnum malibu marauder mariner matrix maverick metro milan mirage
  monaco montana monterey mountaineer mustang mystique nautilus navajo navigator neon nitro
  oasis ocean odyssey optima outback outlook paceman pacifica palisade passport pathfinder
  patriot pear phantom pilot prelude premier probe prologue prowler quest quattro rabbit
  rainier ranger recon regal regency relay renegade rio riviera roadmaster roadster rocky
  rodeo rogue roma ronin sable samurai sequoia shadow sidekick sierra silhouette skylark
  solstice sonic sonata soul spark spectra spider spirit stanza stealth stinger storm
  stratus stylus suburban summit supra swift talon taurus tempo terrain thunderbird titan
  topaz torrent tracer tracker transit traverse tribute trooper tundra vanquish vantage
  venue verona vibe vigor villager viper vision volt voyager wraith wrangler zephyr cube sky
`
    .split(/\s+/)
    .filter(Boolean),
);

export const fuzzyStopWords = new Set(
  `
  a an and are as at be been before between booking both bring budget but by call can car
  cars clean cleaner cleaning clear coat coating code cost could cover detail detailing
  dirt do does door doors drive driver driving dust email film first fit focus for from
  front full garage get got had has have hello here hi hood how i if in into is it its
  just key keys like looking may me miles mirror mirrors model month months my need needs
  new no number of off on one only or our out over own paint panel paper pay phone pickup
  please polish polishing price prices quote rear remove repair right roof say seat seats
  send service shop should side sides small some spot spots stain stains text than thanks
  that the their them then there these they this those time tint to today tomorrow too
  total two under up us used vehicle want was wash washing wax we week what when where
  which while who will window windows with would year years yes you your charge charged
  camera compass passport pilot air leaf accent echo soul golf journey accord legacy venue
`
    .split(/\s+/)
    .filter(Boolean),
);
