export const UNITY_FBX_V1_PROFILE = {
  id: 'unity-fbx-v1',
  label: 'Unity FBX v1',
  units: 'meters',
  upAxis: 'Y',
  forwardAxis: 'Z',
  rootPivot: 'tree-root',
  packSize: 10,
  lodCount: 4,
  target: 'unity',
}

export const EXPORT_PROFILES = {
  [UNITY_FBX_V1_PROFILE.id]: UNITY_FBX_V1_PROFILE,
}

export const getExportProfile = (profileId = UNITY_FBX_V1_PROFILE.id) => EXPORT_PROFILES[profileId] ?? UNITY_FBX_V1_PROFILE
