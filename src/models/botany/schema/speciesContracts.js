// v1 artist-authored natural-variation contracts for the five native reference taxa.
// Numeric limits are procedural art-direction bounds, NOT asserted biological maxima.
// Stored params remain the generator's authoritative editable values.
export const SPECIES_CONTRACT_VERSION = 1
const field = (min, typical, max, unit, step = 0.01) => ({ min, typical, max, unit, step })
const core = {
  Pine: {
    taxonId: 'pinus-strobus', scientificName: 'Pinus strobus', commonName: 'Eastern White Pine',
    habit: 'layered conifer', sources: ['https://plantdatabase.uconn.edu/detail.php?pid=332'],
    radiusRatio: [0.018, 0.026, 0.040],
    fields: {
      height: field(20, 37, 48, 'm', 1), radius: field(0.4, 0.96, 1.9, 'm', .02),
      taper: field(.025, .13, .3, 'ratio'), leafCount: field(1200, 4500, 9000, 'instances', 100),
      leafSize: field(.14, .27, .44, 'm'), leaderCount: field(0, 1, 2, 'axes', 1),
      twigDensity: field(3, 7, 13, 'tips', 1), twigLength: field(.6, 1.3, 2.2, 'relative'),
      twigGravity: field(0, .12, .45, 'strength'), simulationYears: field(10, 35, 80, 'years', 1),
      'levels[0].branchCount': field(6, 10, 14, 'branches', 1),
      'levels[0].branchAngle': field(.84, 1.17, 1.49, 'rad'),
      'levels[0].lengthScale': field(.32, .57, .77, 'ratio'),
    },
  },
  Oak: {
    taxonId: 'quercus-alba', scientificName: 'Quercus alba', commonName: 'White Oak',
    habit: 'broad spreading deciduous', sources: ['https://plantdatabase.uconn.edu/detail.php?pid=377'],
    radiusRatio: [.027, .046, .075],
    fields: {
      height: field(18, 31, 42, 'm', 1), radius: field(.65, 1.43, 3.1, 'm', .02),
      taper: field(.08, .19, .36, 'ratio'), leafCount: field(1000, 4600, 9500, 'instances', 100),
      leafSize: field(.28, .54, .8, 'm'), leaderCount: field(1, 2, 4, 'axes', 1),
      twigDensity: field(3, 6, 12, 'tips', 1), twigLength: field(.4, 1.2, 2.4, 'relative'),
      twigGravity: field(0, .22, .6, 'strength'), simulationYears: field(18, 50, 110, 'years', 1),
      'levels[0].branchCount': field(5, 8, 13, 'branches', 1),
      'levels[0].branchAngle': field(1.05, 1.40, 1.65, 'rad'),
      'levels[0].lengthScale': field(.78, 1.10, 1.4, 'ratio'),
    },
  },
  Willow: {
    taxonId: 'salix-babylonica', scientificName: 'Salix babylonica', commonName: 'Weeping Willow',
    habit: 'hanging deciduous', sources: ['https://hort.ifas.ufl.edu/trees/SALSPPA.pdf'],
    radiusRatio: [.02, .033, .06],
    fields: {
      height: field(12, 29, 36, 'm', 1), radius: field(.32, .96, 1.8, 'm', .02),
      taper: field(.06, .16, .34, 'ratio'), leafCount: field(1300, 4600, 9000, 'instances', 100),
      leafSize: field(.18, .34, .5, 'm'), leaderCount: field(0, 1, 3, 'axes', 1),
      twigDensity: field(5, 10, 17, 'tips', 1), twigLength: field(1.3, 3.2, 5.2, 'relative'),
      twigGravity: field(1.4, 2.4, 3.0, 'strength'), simulationYears: field(10, 25, 65, 'years', 1),
      'levels[0].branchCount': field(5, 9, 14, 'branches', 1),
      'levels[0].branchAngle': field(.96, 1.28, 1.65, 'rad'),
      'levels[0].lengthScale': field(.62, .98, 1.28, 'ratio'),
    },
  },
  Birch: {
    taxonId: 'betula-papyrifera', scientificName: 'Betula papyrifera', commonName: 'Paper Birch',
    habit: 'slender open deciduous', sources: ['https://www.dnr.state.mn.us/trees/paper-birch.html'],
    radiusRatio: [.012, .018, .035],
    fields: {
      height: field(18, 34, 43, 'm', 1), radius: field(.25, .61, 1.5, 'm', .02),
      taper: field(.04, .11, .28, 'ratio'), leafCount: field(700, 2700, 6200, 'instances', 100),
      leafSize: field(.18, .3, .52, 'm'), leaderCount: field(1, 2, 4, 'axes', 1),
      twigDensity: field(3, 6, 12, 'tips', 1), twigLength: field(.5, 1.1, 2, 'relative'),
      twigGravity: field(0, .12, .5, 'strength'), simulationYears: field(8, 30, 70, 'years', 1),
      'levels[0].branchCount': field(5, 9, 13, 'branches', 1),
      'levels[0].branchAngle': field(.77, 1.12, 1.4, 'rad'),
      'levels[0].lengthScale': field(.42, .64, .84, 'ratio'),
    },
  },
  Cypress: {
    taxonId: 'cupressus-sempervirens', scientificName: 'Cupressus sempervirens', commonName: 'Italian Cypress',
    habit: 'columnar evergreen', sources: ['https://ask.ifas.ufl.edu/publication/ST225'],
    radiusRatio: [.012, .02, .036],
    fields: {
      height: field(18, 38, 46, 'm', 1), radius: field(.3, .76, 1.6, 'm', .02),
      taper: field(.015, .07, .17, 'ratio'), leafCount: field(1800, 5400, 10000, 'instances', 100),
      leafSize: field(.08, .18, .33, 'm'), leaderCount: field(0, 1, 2, 'axes', 1),
      twigDensity: field(5, 9, 18, 'tips', 1), twigLength: field(.35, .85, 1.6, 'relative'),
      twigGravity: field(0, .06, .28, 'strength'), simulationYears: field(10, 35, 90, 'years', 1),
      'levels[0].branchCount': field(8, 12, 18, 'branches', 1),
      'levels[0].branchAngle': field(.18, .34, .6, 'rad'),
      'levels[0].lengthScale': field(.08, .17, .31, 'ratio'),
    },
  },
}
export const SPECIES_CONTRACTS = Object.fromEntries(Object.entries(core).map(([name, c]) => [name, {
  ...c, name, version: SPECIES_CONTRACT_VERSION, confidence: 'provisional-art-direction',
  naturalBoundsOnly: true, // older saved assets and bounded testing recipes stay loadable
}]))
export const getSpeciesContract = name => SPECIES_CONTRACTS[name] ?? null
const get = (object, path) => {
  const tokens = path.replaceAll('[', '.').replaceAll(']', '').split('.')
  return tokens.reduce((value, key) => value?.[key], object)
}
const set = (object, path, value) => {
  const tokens = path.replaceAll('[', '.').replaceAll(']', '').split('.')
  let target = object
  for (const token of tokens.slice(0, -1)) target = target[token]
  target[tokens.at(-1)] = value
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const fitRatio = (params, contract) => {
  const [min,,max] = contract.radiusRatio
  params.radius = +clamp(params.radius, Math.max(contract.fields.radius.min, params.height * min), Math.min(contract.fields.radius.max, params.height * max)).toFixed(4)
}
export const createSpeciesDefaults = (name, base) => {
  const contract = getSpeciesContract(name)
  if (!contract) return structuredClone(base)
  const params = structuredClone(base)
  for (const [path, spec] of Object.entries(contract.fields)) set(params, path, spec.typical)
  params.name = name
  params.speciesId = contract.taxonId
  params.speciesContractVersion = contract.version
  return params
}
export const validateNativeParams = (params) => {
  const contract = getSpeciesContract(params?.name)
  if (!contract) return { valid: true, errors: [], contract: null }
  const errors = []
  if (params.speciesId && params.speciesId !== contract.taxonId) errors.push({path:'params.speciesId',message:'Taxon identity differs from its contract.'})
  if (params.speciesContractVersion && params.speciesContractVersion !== contract.version) errors.push({path:'params.speciesContractVersion',message:'Reopen with the matching contract version or migrate explicitly.'})
  for (const [path, spec] of Object.entries(contract.fields)) {
    const val = get(params,path)
    if (typeof val !== 'number' || !Number.isFinite(val) || val < spec.min - 1e-8 || val > spec.max + 1e-8) {
      errors.push({path:'params.'+path,message:`Native ${spec.unit} range: ${spec.min}–${spec.max}.`,value:val})
    }
  }
  const ratio = params.radius / params.height
  if (!Number.isFinite(ratio) || ratio < contract.radiusRatio[0] - 1e-8 || ratio > contract.radiusRatio[2] + 1e-8) {
    errors.push({path:'params.radius',message:`Trunk radius/height ratio must be ${contract.radiusRatio[0]}–${contract.radiusRatio[2]}.`,value:ratio})
  }
  return { valid: errors.length === 0, errors, contract }
}
// Editor edits are constrained to the selected species. Height edits carry the existing
// trunk ratio to avoid silently converting a normal tree into a pole or a stump.
export const applyNativeEdit = (source, path, requested) => {
  const params = structuredClone(source)
  const contract = getSpeciesContract(params?.name)
  const key = path.replace(/^params\./, '')
  const spec = contract?.fields[key]
  if (!spec) return { params, accepted:false, error:'No native control for '+key }
  if (typeof requested !== 'number' || !Number.isFinite(requested) || requested < spec.min || requested > spec.max) {
    return { params, accepted:false, error:`${key}: allowed ${spec.min}–${spec.max} ${spec.unit}.` }
  }
  const currentRatio = params.radius / params.height
  set(params,key,requested)
  if (key === 'height') {
    params.radius = +(params.height * clamp(currentRatio,...[contract.radiusRatio[0],contract.radiusRatio[2]])).toFixed(4)
    fitRatio(params,contract)
  } else if (key === 'radius') fitRatio(params,contract)
  // For radius, an independent out-of-ratio user value must be reported, not quietly accepted.
  if (key === 'radius' && Math.abs(params.radius-requested) > .0001) {
    return { params:source, accepted:false,error:'Radius conflicts with the taxon’s trunk allometry.' }
  }
  const result = validateNativeParams(params)
  return result.valid ? {params,accepted:true,error:null} : {params:source,accepted:false,error:result.errors[0].message}
}
// Existing saved specimens are left intact until the artist requests migration.
// This returns an auditable set of changes for the UI rather than rewriting on load.
export const normalizeLegacyToNative = source => {
  const contract = getSpeciesContract(source?.name)
  if (!contract) return {params:structuredClone(source), changes:[]}
  const params = structuredClone(source)
  const changes = []
  for (const [path, spec] of Object.entries(contract.fields)) {
    const before = get(params,path)
    const after = typeof before === 'number' && Number.isFinite(before)
      ? clamp(before,spec.min,spec.max) : spec.typical
    if (before !== after) {
      changes.push({path,from:before,to:after})
      set(params,path,after)
    }
  }
  const priorRadius = params.radius
  fitRatio(params,contract)
  if (priorRadius !== params.radius) changes.push({path:'radius',from:priorRadius,to:params.radius,reason:'height/radius coupling'})
  for (const [path,value] of [['speciesId',contract.taxonId],['speciesContractVersion',contract.version]]) {
    if (params[path] !== value) {
      changes.push({path,from:params[path],to:value})
      params[path] = value
    }
  }
  return {params,changes}
}
const mulberry32 = seed => () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296 }
export const randomizeNativeParams = (source, seed) => {
  const contract = getSpeciesContract(source?.name)
  if (!contract || !Number.isInteger(seed)) throw Error('Unknown species or invalid seed')
  const next = createSpeciesDefaults(contract.name,source)
  const rng = mulberry32(seed)
  // One shared vigor term couples height, leaf coverage and branch numbers.
  const vigor = .25 + .5 * rng()
  for(const [path,spec] of Object.entries(contract.fields)) {
    if (path === 'radius') continue
    let u = clamp(.52 * rng() + .48 * vigor,0,1)
    if (path === 'levels[0].lengthScale') u = .65 * u + .35 * vigor
    let val = spec.min + (spec.max-spec.min)*u
    if (Number.isInteger(spec.step)) val = Math.round(val / spec.step) * spec.step
    else val = +val.toFixed(4)
    set(next,path,clamp(val,spec.min,spec.max))
  }
  const [min,typical,max] = contract.radiusRatio
  const ratio = clamp(typical * (.8 + .4 * vigor), min,max)
  next.radius = +clamp(next.height*ratio,contract.fields.radius.min,contract.fields.radius.max).toFixed(4)
  fitRatio(next,contract)
  next.seed = seed
  const validation = validateNativeParams(next)
  if (!validation.valid) throw Error('Invalid randomized contract: '+JSON.stringify(validation.errors))
  return next
}
// The reference library is a domain-owned list. A partially populated API must
// never make native profiles disappear from the editor's preset picker.
export const getNativePresetCatalog = (available = []) => Object.keys(SPECIES_CONTRACTS).map(name => {
  const found = available.find(item => item?.name === name && item?.kind === 'tree' && !item?.customSpecimenId)
  return found ? { ...found, name, kind: 'tree' } : { id: `builtin:${name.toLowerCase()}`, name, kind: 'tree' }
})

// Featured controls are implemented generator traits, not decorative sliders.
// They vary between taxa to expose the defining silhouette and foliage behavior.
const featuredFields = {
  Pine: {
    'levels[0].branchCount': 'Whorl Branches',
    'levels[0].branchAngle': 'Whorl Spread',
    twigDensity: 'Needle-bearing Tips',
    twigLength: 'Shoot Length',
  },
  Oak: {
    'levels[0].branchCount': 'Scaffold Limbs',
    'levels[0].branchAngle': 'Major Limb Spread',
    'levels[0].lengthScale': 'Crown Reach',
    leafCount: 'Crown Leaf Density',
  },
  Willow: {
    'levels[0].lengthScale': 'Arching Crown Reach',
    twigGravity: 'Pendant Twig Pull',
    twigLength: 'Trailing Shoot Length',
    twigDensity: 'Curtain Branchlets',
  },
  Birch: {
    'levels[0].branchAngle': 'Fine Branch Rise',
    'levels[0].lengthScale': 'Open Crown Width',
    twigDensity: 'Fine Twig Density',
    leafCount: 'Light Canopy Density',
  },
  Cypress: {
    'levels[0].lengthScale': 'Column Spread',
    'levels[0].branchAngle': 'Ascending Shoot Angle',
    twigDensity: 'Scale Spray Density',
    leafSize: 'Scale Spray Size',
  },
}

export const getNativeInspectorSpecs = name => {
  const contract=getSpeciesContract(name)
  if (!contract) return []
  return Object.entries(contract.fields).map(([path,s])=>({
    path:'params.'+path, label:featuredFields[name]?.[path] ?? path.split('.').at(-1).replace(/([A-Z])/g,' $1').replace(/^./,v=>v.toUpperCase()),
    featured:Boolean(featuredFields[name]?.[path]),
    widget:'slider',integer:Number.isInteger(s.step),min:s.min,max:s.max,step:s.step,unit:s.unit,
    help:`Native range for ${contract.commonName} (provisional art direction); typical ${s.typical} ${s.unit}.`,
  }))
}
