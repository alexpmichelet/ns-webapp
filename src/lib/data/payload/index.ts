// ================================================================================ //
// ========================== Payload API Data Operations ========================= //
// ================================================================================ //

// Provide empty stubs if custom implementations are missing
// Narrowed unknown types for optional custom modules
// Use unknown and type assertions at usage sites rather than any
let customPayloadActions: unknown = {}
let customPayloadHooks: unknown = {}
try {
  customPayloadActions = await import('./custom/server-actions')
} catch {}
try {
  customPayloadHooks = await import('./custom/hooks')
} catch {}
import {
  payloadAuthAction,
  payloadCountAction,
  payloadCountGlobalVersionsAction,
  payloadCountVersionsAction,
  payloadCreateAction,
  payloadDuplicateAction,
  payloadExtensionsAction,
  payloadFindAction,
  payloadFindByIDAction,
  payloadFindGlobalAction,
  payloadFindGlobalVersionByIDAction,
  payloadFindGlobalVersionsAction,
  payloadFindVersionByIDAction,
  payloadFindVersionsAction,
  payloadForgotPasswordAction,
  payloadLoginAction,
  payloadResetPasswordAction,
  payloadRestoreGlobalVersionAction,
  payloadRestoreVersionAction,
  payloadSendEmailAction,
  payloadUnlockAction,
  payloadUpdateGlobalAction,
  payloadUpdateAction,
  payloadUpdateByIDAction,
  payloadDeleteAction,
  payloadDeleteByIDAction,
  payloadResolveAction,
  payloadVerifyEmailAction,
} from './default/server-actions'
import {
  usePayloadAuthHook,
  usePayloadCountHook,
  usePayloadCountGlobalVersionsHook,
  usePayloadCountVersionsHook,
  usePayloadCreateHook,
  usePayloadDuplicateHook,
  usePayloadExtensionsHook,
  usePayloadFindHook,
  usePayloadFindByIDHook,
  usePayloadFindGlobalHook,
  usePayloadFindGlobalVersionByIDHook,
  usePayloadFindGlobalVersionsHook,
  usePayloadFindVersionByIDHook,
  usePayloadFindVersionsHook,
  usePayloadForgotPasswordHook,
  usePayloadLoginHook,
  usePayloadResetPasswordHook,
  usePayloadRestoreGlobalVersionHook,
  usePayloadRestoreVersionHook,
  usePayloadSendEmailHook,
  usePayloadUnlockHook,
  usePayloadUpdateGlobalHook,
  usePayloadUpdateHook,
  usePayloadUpdateByIDHook,
  usePayloadDeleteHook,
  usePayloadDeleteByIDHook,
  usePayloadResolveHook,
  usePayloadResolveManyHook,
  usePayloadVerifyEmailHook,
} from './default/hooks'

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Server Actions Export ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

export * from './default/server-actions'
export const payloadAction = {
  auth: payloadAuthAction,
  count: payloadCountAction,
  countGlobalVersions: payloadCountGlobalVersionsAction,
  countVersions: payloadCountVersionsAction,
  create: payloadCreateAction,
  duplicate: payloadDuplicateAction,
  extensions: payloadExtensionsAction,
  find: payloadFindAction,
  findByID: payloadFindByIDAction,
  findGlobal: payloadFindGlobalAction,
  findGlobalVersionByID: payloadFindGlobalVersionByIDAction,
  findGlobalVersions: payloadFindGlobalVersionsAction,
  findVersionByID: payloadFindVersionByIDAction,
  findVersions: payloadFindVersionsAction,
  forgotPassword: payloadForgotPasswordAction,
  login: payloadLoginAction,
  resetPassword: payloadResetPasswordAction,
  restoreGlobalVersion: payloadRestoreGlobalVersionAction,
  restoreVersion: payloadRestoreVersionAction,
  sendEmail: payloadSendEmailAction,
  unlock: payloadUnlockAction,
  updateGlobal: payloadUpdateGlobalAction,
  verifyEmail: payloadVerifyEmailAction,
  delete: payloadDeleteAction,
  deleteByID: payloadDeleteByIDAction,
  update: payloadUpdateAction,
  updateByID: payloadUpdateByIDAction,
  // NS Custom
  resolve: payloadResolveAction,
  custom: customPayloadActions,
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Hooks Export ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

export * from './default/hooks'
export const payloadHook = {
  auth: usePayloadAuthHook,
  count: usePayloadCountHook,
  countGlobalVersions: usePayloadCountGlobalVersionsHook,
  countVersions: usePayloadCountVersionsHook,
  create: usePayloadCreateHook,
  duplicate: usePayloadDuplicateHook,
  extensions: usePayloadExtensionsHook,
  find: usePayloadFindHook,
  findByID: usePayloadFindByIDHook,
  findGlobal: usePayloadFindGlobalHook,
  findGlobalVersionByID: usePayloadFindGlobalVersionByIDHook,
  findGlobalVersions: usePayloadFindGlobalVersionsHook,
  findVersionByID: usePayloadFindVersionByIDHook,
  findVersions: usePayloadFindVersionsHook,
  forgotPassword: usePayloadForgotPasswordHook,
  login: usePayloadLoginHook,
  resetPassword: usePayloadResetPasswordHook,
  restoreGlobalVersion: usePayloadRestoreGlobalVersionHook,
  restoreVersion: usePayloadRestoreVersionHook,
  sendEmail: usePayloadSendEmailHook,
  unlock: usePayloadUnlockHook,
  updateGlobal: usePayloadUpdateGlobalHook,
  verifyEmail: usePayloadVerifyEmailHook,
  delete: usePayloadDeleteHook,
  deleteByID: usePayloadDeleteByIDHook,
  update: usePayloadUpdateHook,
  updateByID: usePayloadUpdateByIDHook,
  // NS Custom
  resolve: usePayloadResolveHook,
  resolveMany: usePayloadResolveManyHook,
  custom: customPayloadHooks,
}
