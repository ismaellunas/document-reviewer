/**
 * Centralised PostgREST select fragments for embedded relations.
 *
 * Embedding `gewci_users` from `drr_documents` or `drr_comments` is
 * ambiguous because both tables have multiple FKs to `gewci_users`
 * (`created_by`/`updated_by`, `user_id`/`resolved_by`). PostgREST returns
 * a `PGRST201` error and zero rows when the FK is not specified.
 *
 * Defining the fragments here means the FK names are spelled exactly once,
 * and any future relation joins reuse the constants instead of reinventing
 * a new ambiguous select string.
 */

const USER_PROFILE = `
  id,
  email,
  display_name,
  avatar_url,
  roles
`;

/**
 * `drr_documents` row joined with the user who created it.
 * Disambiguates against `updated_by`.
 */
export const DOCUMENT_WITH_CREATOR = `
  *,
  creator:gewci_users!drr_documents_created_by_fkey (
    ${USER_PROFILE}
  )
`;

/**
 * `drr_documents` row joined with creator AND a thin comments collection
 * so we can compute `comment_count` without a second round-trip.
 */
export const DOCUMENT_WITH_CREATOR_AND_COMMENT_COUNT = `
  *,
  creator:gewci_users!drr_documents_created_by_fkey (
    ${USER_PROFILE}
  ),
  comments:drr_comments (
    id
  )
`;

/**
 * `drr_comments` row joined with the comment's author.
 * Disambiguates against `resolved_by`.
 */
export const COMMENT_WITH_AUTHOR = `
  *,
  user:gewci_users!drr_comments_user_id_fkey (
    ${USER_PROFILE}
  )
`;
