// @ts-nocheck
'use server'

// ================================================================================ //
// ======================== Payload Default Server Actions ======================== //
// ================================================================================ //

import { CollectionSlug, BasePayload, GlobalSlug, getPayload, APIError } from 'payload'
import type { SelectFromCollectionSlug } from 'payload'
// Use any for operation option types to avoid tight coupling to internal paths
type UpdateByIDOptions<TSlug extends CollectionSlug, TSelect> = any
type UpdateManyOptions<TSlug extends CollectionSlug, TSelect> = any
type DeleteByIDOptions<TSlug extends CollectionSlug, TSelect> = any
type DeleteManyOptions<TSlug extends CollectionSlug, TSelect> = any
type CountOptions<T> = any
import type { SelectFromGlobalSlug } from 'payload'
import config from '@payload-config'
type AuthArgs = any
type CountGlobalVersionsOptions<T> = any
type CreateOptions<TSlug extends CollectionSlug, TSelect> = any
type DuplicateOptions<TSlug extends CollectionSlug, TSelect> = any
type FindOptions<TSlug extends CollectionSlug, TSelect> = any
type FindByIDOptions<TSlug extends CollectionSlug, TDisableErrors extends boolean, TSelect> = any
type FindGlobalOptions<TSlug extends GlobalSlug, TSelect> = any
type FindGlobalVersionByIDOptions<TSlug extends GlobalSlug> = any
type FindGlobalVersionsOptions<TSlug extends GlobalSlug> = any
type FindVersionByIDOptions<TSlug extends CollectionSlug> = any
type FindVersionsOptions<TSlug extends CollectionSlug> = any
type ForgotPasswordOptions<TSlug extends CollectionSlug> = any
type LoginOptions<TSlug extends CollectionSlug> = any
type ResetPasswordOptions<TSlug extends CollectionSlug> = any
type RestoreGlobalVersionOptions<TSlug extends GlobalSlug> = any
type RestoreVersionOptions<TSlug extends CollectionSlug> = any
type UnlockOptions<TSlug extends CollectionSlug> = any
type UpdateGlobalOptions<TSlug extends GlobalSlug, TSelect> = any
type VerifyEmailOptions<TSlug extends CollectionSlug> = any

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~ Payload Default Server Actions Definition ~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

export async function payloadAuthAction(options: AuthArgs) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.auth(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadAuthAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadCountAction<T extends CollectionSlug>(options: CountOptions<T>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.count<T>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadCountAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadCountGlobalVersionsAction<T extends GlobalSlug>(
  options: CountGlobalVersionsOptions<T>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.countGlobalVersions<T>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadCountGlobalVersionsAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadCountVersionsAction<T extends CollectionSlug>(
  options: CountOptions<T>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.countVersions<T>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadCountVersionsAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadCreateAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
>(options: CreateOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.create<TSlug, TSelect>(options)
    return result
  } catch (error) {
    console.error(
      `[payloadCreateAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function payloadDuplicateAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
>(options: DuplicateOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.duplicate<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadDuplicateAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadExtensionsAction(options: Parameters<BasePayload['extensions']>[0]) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.extensions(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadExtensionsAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadFindAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
>(options: FindOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.find<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadFindByIDAction<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
>(options: FindByIDOptions<TSlug, TDisableErrors, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findByID<TSlug, TDisableErrors, TSelect>(options)
    return result
  } catch (error) {
    // Honor disableErrors: if caller requested suppressed errors and the error is a 404, return null
    if ((options as any)?.disableErrors) {
      if (error instanceof APIError) {
        // Payload's APIError for not found typically has message 'Not Found' and status 404
        if ((error as any).status === 404 || /Not\s*Found/i.test(error.message)) {
          // @ts-ignore
          return null
        }
      }
    }

    console.error(`[payloadFindByIDAction]: The id passed is ${options.id}`)
    throw new Error(
      `[payloadFindByIDAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadFindGlobalAction<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  //@ts-ignore
>(options: FindGlobalOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findGlobal<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindGlobalAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadFindGlobalVersionByIDAction<TSlug extends GlobalSlug>(
  options: FindGlobalVersionByIDOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findGlobalVersionByID<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindGlobalVersionByIDAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadFindGlobalVersionsAction<TSlug extends GlobalSlug>(
  options: FindGlobalVersionsOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findGlobalVersions<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindGlobalVersionsAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadFindVersionByIDAction<TSlug extends CollectionSlug>(
  options: FindVersionByIDOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findVersionByID<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindVersionByIDAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadFindVersionsAction<TSlug extends CollectionSlug>(
  options: FindVersionsOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.findVersions<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadFindVersionsAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadForgotPasswordAction<TSlug extends CollectionSlug>(
  options: ForgotPasswordOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.forgotPassword<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadForgotPasswordAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadLoginAction<TSlug extends CollectionSlug>(
  options: LoginOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.login<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadLoginAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadResetPasswordAction<TSlug extends CollectionSlug>(
  options: ResetPasswordOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.resetPassword<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadResetPasswordAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadRestoreGlobalVersionAction<TSlug extends GlobalSlug>(
  options: RestoreGlobalVersionOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.restoreGlobalVersion<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadRestoreGlobalVersionAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadRestoreVersionAction<TSlug extends CollectionSlug>(
  options: RestoreVersionOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.restoreVersion<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadRestoreVersionAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadSendEmailAction(options: Parameters<BasePayload['sendEmail']>[0]) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.sendEmail(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadSendEmailAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadUnlockAction<TSlug extends CollectionSlug>(
  options: UnlockOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.unlock<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadUnlockAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadUpdateGlobalAction<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  //@ts-ignore
>(options: UpdateGlobalOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.updateGlobal<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadUpdateGlobalAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadVerifyEmailAction<TSlug extends CollectionSlug>(
  options: VerifyEmailOptions<TSlug>,
) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.verifyEmail<TSlug>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadVerifyEmailAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadDeleteAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(options: DeleteManyOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.delete<TSlug, TSelect>(options)
    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message)
    }
    return result
  } catch (error) {
    console.error(
      `[payloadDeleteAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function payloadDeleteByIDAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(options: DeleteByIDOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.delete<TSlug, TSelect>(options)
    return result
  } catch (error) {
    console.error(
      `[payloadDeleteByIDAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    throw new Error(`${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function payloadUpdateAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(options: UpdateManyOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.update<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadUpdateAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function payloadUpdateByIDAction<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(options: UpdateByIDOptions<TSlug, TSelect>) {
  const payload = await getPayload({ config })
  try {
    const result = await payload.update<TSlug, TSelect>(options)
    return result
  } catch (error) {
    throw new Error(
      `[payloadUpdateByIDAction] Error : ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
  }
}

export async function payloadResolveAction<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
  T extends TransformCollectionWithSelect<TSlug, TSelect>,
>(
  entity: string | number | T | null | undefined,
  //@ts-ignore
  options: Omit<FindByIDOptions<TSlug, TDisableErrors, TSelect>, 'id'>,
) {
  const payload = await getPayload({ config })
  try {
    if (!entity) return null
    else if (typeof entity !== 'string' && typeof entity !== 'number') return entity
    else
      return await payload.findByID<TSlug, TDisableErrors, TSelect>({
        ...options,
        id: entity,
      })
  } catch (error) {
    throw new Error(
      `[payloadResolveAction] Error : ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
