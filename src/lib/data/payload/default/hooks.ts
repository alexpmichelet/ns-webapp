// @ts-nocheck
// ================================================================================ //
// =============================== Payload API Hooks ============================== //
// ================================================================================ //

import {
  ApplyDisableErrors,
  CollectionSlug,
  GlobalSlug,
  TransformCollectionWithSelect,
} from 'payload'
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
} from './server-actions'
import {
  UseQueryOptions as UseTanstackQueryOptions,
  useQuery as useTanstackQuery,
  useQueries as useTanstackQueries,
  UseMutationOptions as UseTanstackMutationOptions,
  useMutation as useTanstackMutation,
  DefaultError,
  useQueryClient,
} from '@tanstack/react-query'
// These deep imports cause ts resolution errors in some environments; import from payload root types instead
import type { SelectFromCollectionSlug } from 'payload'
import type { SelectFromGlobalSlug } from 'payload'

export default function getRelationshipId(
  value: string | number | { id: string | number } | null | undefined,
): string | number {
  if (!value) return '__invalid__'
  if (typeof value === 'number' || typeof value === 'string') return value
  else return value.id
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~ Payload API Hooks Definitions ~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

export function usePayloadAuthHook(
  payloadOptions: Parameters<typeof payloadAuthAction>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadAuthAction>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: ['auth', payloadOptions] as const,
    queryFn: async () => await payloadAuthAction(payloadOptions),
  })
}

export function usePayloadCountHook(
  payloadOptions: Parameters<typeof payloadCountAction>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadCountAction>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'count', payloadOptions] as const,
    queryFn: async () => await payloadCountAction(payloadOptions),
  })
}

export function usePayloadCountGlobalVersionsHook(
  payloadOptions: Parameters<typeof payloadCountGlobalVersionsAction>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadCountGlobalVersionsAction>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.global, 'countGlobalVersions', payloadOptions] as const,
    queryFn: async () => await payloadCountGlobalVersionsAction(payloadOptions),
  })
}

export function usePayloadCountVersionsHook(
  payloadOptions: Parameters<typeof payloadCountVersionsAction>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadCountVersionsAction>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'countVersions', payloadOptions] as const,
    queryFn: async () => await payloadCountVersionsAction(payloadOptions),
  })
}

export function usePayloadCreateHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      TransformCollectionWithSelect<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadCreateAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadCreateAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadCreateHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadCreateHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadCreateHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadDuplicateHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      TransformCollectionWithSelect<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadDuplicateAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadDuplicateAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadDuplicateHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadDuplicateHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadDuplicateHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadExtensionsHook(
  payloadOptions: Parameters<typeof payloadExtensionsAction>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadExtensionsAction>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: ['extensions', payloadOptions] as const,
    queryFn: async () => await payloadExtensionsAction(payloadOptions),
  })
}

export function usePayloadFindHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payloadOptions: Parameters<typeof payloadFindAction<TSlug, TSelect>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<Awaited<ReturnType<typeof payloadFindAction<TSlug, TSelect>>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'find', payloadOptions] as const,
    queryFn: async () => await payloadFindAction<TSlug, TSelect>(payloadOptions),
  })
}

export function usePayloadFindByIDHook<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  payloadOptions: Parameters<typeof payloadFindByIDAction<TSlug, TDisableErrors, TSelect>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<
      //@ts-ignore
      ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>
    >,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'findByID', payloadOptions] as const,
    //@ts-expect-error because of the payload types
    queryFn: async () =>
      await payloadFindByIDAction<TSlug, TDisableErrors, TSelect>(payloadOptions),
  })
}

export function usePayloadFindGlobalHook<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  payloadOptions: Parameters<typeof payloadFindGlobalAction<TSlug, TSelect>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<ReturnType<typeof payloadFindGlobalAction<TSlug, TSelect>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.slug, 'findGlobal', payloadOptions] as const,
    queryFn: async () => await payloadFindGlobalAction<TSlug, TSelect>(payloadOptions),
  })
}

export function usePayloadFindGlobalVersionByIDHook<TSlug extends GlobalSlug>(
  payloadOptions: Parameters<typeof payloadFindGlobalVersionByIDAction<TSlug>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<ReturnType<typeof payloadFindGlobalVersionByIDAction<TSlug>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.slug, 'findGlobalVersionByID', payloadOptions] as const,
    queryFn: async () => await payloadFindGlobalVersionByIDAction<TSlug>(payloadOptions),
  })
}

export function usePayloadFindGlobalVersionsHook<TSlug extends GlobalSlug>(
  payloadOptions: Parameters<typeof payloadFindGlobalVersionsAction<TSlug>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<ReturnType<typeof payloadFindGlobalVersionsAction<TSlug>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.slug, 'findGlobalVersions', payloadOptions] as const,
    queryFn: async () => await payloadFindGlobalVersionsAction<TSlug>(payloadOptions),
  })
}

export function usePayloadFindVersionByIDHook<TSlug extends CollectionSlug>(
  payloadOptions: Parameters<typeof payloadFindVersionByIDAction<TSlug>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<ReturnType<typeof payloadFindVersionByIDAction<TSlug>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'findVersionByID', payloadOptions] as const,
    queryFn: async () => await payloadFindVersionByIDAction<TSlug>(payloadOptions),
  })
}

export function usePayloadFindVersionsHook<TSlug extends CollectionSlug>(
  payloadOptions: Parameters<typeof payloadFindVersionsAction<TSlug>>[0],
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<ReturnType<typeof payloadFindVersionsAction<TSlug>>>,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'findVersions', payloadOptions] as const,
    queryFn: async () => await payloadFindVersionsAction<TSlug>(payloadOptions),
  })
}

export function usePayloadForgotPasswordHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadForgotPasswordAction<TSlug>>>,
      DefaultError,
      Omit<Parameters<typeof payloadForgotPasswordAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadForgotPasswordAction({
        ...variables,
        collection: collection,
      }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadForgotPasswordHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadForgotPasswordHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadForgotPasswordHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadLoginHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadLoginAction<TSlug>>>,
      DefaultError,
      Omit<Parameters<typeof payloadLoginAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadLoginAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadLoginHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadLoginHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadLoginHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadResetPasswordHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadResetPasswordAction<TSlug>>>,
      DefaultError,
      Omit<Parameters<typeof payloadResetPasswordAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadResetPasswordAction({
        ...variables,
        collection: collection,
      }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadResetPasswordHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadResetPasswordHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadResetPasswordHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadRestoreGlobalVersionHook<TSlug extends GlobalSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      DataFromGlobalSlug<TSlug>,
      DefaultError,
      Omit<Parameters<typeof payloadRestoreGlobalVersionAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) => await payloadRestoreGlobalVersionAction({ ...variables }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadRestoreGlobalVersionHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(
          `[usePayloadRestoreGlobalVersionHook] Invalidating queries for ${collection}...`,
        )
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadRestoreGlobalVersionHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadRestoreVersionHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      DataFromCollectionSlug<TSlug>,
      DefaultError,
      Omit<Parameters<typeof payloadRestoreVersionAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadRestoreVersionAction({
        ...variables,
        collection: collection,
      }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadRestoreVersionHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadRestoreVersionHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadRestoreVersionHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadSendEmailHook(
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadSendEmailAction>>,
      DefaultError,
      Omit<Parameters<typeof payloadSendEmailAction>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) => await payloadSendEmailAction({ ...variables }),
    onSuccess: (data, variables, context) => {
      console.log(`[usePayloadSendEmailHook] Success !\n\nData: ${JSON.stringify(data, null, 2)}`)
    },
    onError: (error, variables, context) => {
      console.log(`[usePayloadSendEmailHook] Error...\n\nError: ${error.message}`)
    },
  })
}

export function usePayloadUnlockHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadUnlockAction<TSlug>>>,
      DefaultError,
      Omit<Parameters<typeof payloadUnlockAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadUnlockAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadUnlockHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadUnlockHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadUnlockHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadUpdateGlobalHook<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      TransformGlobalWithSelect<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadUpdateGlobalAction<TSlug, TSelect>>[0], 'slug'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadUpdateGlobalAction({ ...variables, slug: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadUpdateGlobalHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadUpdateGlobalHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadUpdateGlobalHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadVerifyEmailHook<TSlug extends CollectionSlug>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      Awaited<ReturnType<typeof payloadVerifyEmailAction<TSlug>>>,
      DefaultError,
      Omit<Parameters<typeof payloadVerifyEmailAction<TSlug>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadVerifyEmailAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadVerifyEmailHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadVerifyEmailHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadVerifyEmailHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadDeleteHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      BulkOperationResult<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadDeleteAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadDeleteAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadDeleteHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadDeleteHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadDeleteHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadDeleteByIDHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      TransformCollectionWithSelect<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadDeleteByIDAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadDeleteByIDAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadDeleteByIDHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadDeleteByIDHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadDeleteByIDHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadUpdateHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      BulkOperationResult<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadUpdateAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadUpdateAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadUpdateHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadUpdateHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadUpdateHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadUpdateByIDHook<
  TSlug extends CollectionSlug,
  TSelect extends SelectFromCollectionSlug<TSlug>,
>(
  collection: TSlug,
  tanstackMutationOptions?: Omit<
    UseTanstackMutationOptions<
      //@ts-ignore
      TransformCollectionWithSelect<TSlug, TSelect>,
      DefaultError,
      Omit<Parameters<typeof payloadUpdateByIDAction<TSlug, TSelect>>[0], 'collection'>,
      unknown
    > & { skipDefaultInvalidation?: boolean },
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()
  return useTanstackMutation({
    ...tanstackMutationOptions,
    mutationFn: async (variables) =>
      await payloadUpdateByIDAction({ ...variables, collection: collection }),
    onSuccess: (data, variables, context) => {
      console.log(
        `[usePayloadUpdateByIDHook] Success !\n\nObject Type : ${collection}\n\nData: ${JSON.stringify(
          data,
          null,
          2,
        )}`,
      )
      tanstackMutationOptions?.onSuccess?.(data, variables, context)
      if (!tanstackMutationOptions?.skipDefaultInvalidation) {
        console.log(`[usePayloadUpdateByIDHook] Invalidating queries for ${collection}...`)
        queryClient.invalidateQueries({ queryKey: [collection] })
      }
    },
    onError: (error, variables, context) => {
      console.log(
        `[usePayloadUpdateByIDHook] Error...\n\nObject Type : ${collection}\n\nError: ${error.message}`,
      )
      tanstackMutationOptions?.onError?.(error, variables, context)
    },
  })
}

export function usePayloadResolveHook<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
  T extends TransformCollectionWithSelect<TSlug, TSelect>,
>(
  entity: string | number | T | null | undefined,
  payloadOptions: Omit<
    Parameters<typeof payloadFindByIDAction<TSlug, TDisableErrors, TSelect>>[0],
    'id'
  >,
  tanstackQueryOptions?: Omit<
    UseTanstackQueryOptions<
      //@ts-ignore
      T | null | undefined
    >,
    'queryKey'
  >,
) {
  return useTanstackQuery({
    ...tanstackQueryOptions,
    queryKey: [payloadOptions.collection, 'findByID', getRelationshipId(entity)] as const,
    queryFn: async () => {
      if (!entity) return null
      else if (typeof entity === 'object') return entity
      else
        await payloadFindByIDAction<TSlug, TDisableErrors, TSelect>({
          ...payloadOptions,
          id: entity,
        })
    },
  })
}

export function usePayloadResolveManyHook<
  TSlug extends CollectionSlug,
  TDisableErrors extends boolean,
  TSelect extends SelectFromCollectionSlug<TSlug>,
  //@ts-ignore
  T extends TransformCollectionWithSelect<TSlug, TSelect>,
>(
  entities: (string | number | T)[] | null | undefined,
  payloadOptions: Omit<
    Parameters<typeof payloadFindByIDAction<TSlug, TDisableErrors, TSelect>>[0],
    'id'
  >,
  tanstackQueryOptions?: Omit<UseTanstackQueryOptions<T[] | null | undefined>, 'queryKey'>,
) {
  return useTanstackQueries({
    ...tanstackQueryOptions,
    queries: (entities || []).map((entity) => ({
      queryKey: [payloadOptions.collection, 'findByID', getRelationshipId(entity)] as const,
      queryFn: async () => {
        if (!entity) return null
        else if (typeof entity === 'object') return entity
        else
          await payloadFindByIDAction<TSlug, TDisableErrors, TSelect>({
            ...payloadOptions,
            id: entity,
          })
      },
    })),
    combine: (results) => ({
      data: results.map((result) => result.data).filter((result) => !!result),
      isLoading: results.some((result) => result.isLoading),
    }),
  })
}
