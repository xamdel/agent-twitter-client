import { requestApi, RequestApiResult } from "./api";
import { TwitterAuth } from "./auth";
import { ApiError } from "./errors";

export interface List {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  subscriberCount: number;
  createdAt: Date;
  bannerUrl?: string;
  ownerProfile: {
    userId: string;
    username: string;
    name: string;
    isBlueVerified: boolean;
  };
}

// Response type for paginated list memberships
export interface ListMembershipsResponse {
  lists: List[];
  nextCursor?: string;
}

// Optional parameters for fetching list memberships
export interface GetListMembershipsOptions {
  count?: number;
  cursor?: string;
}

export async function getListsByUser(
  userId: string,
  count: number = 100,
  auth: TwitterAuth,
): Promise<RequestApiResult<List[]>> {
  const variables = {
    userId,
    count,
  };

  const features = {
    profile_label_improvements_pcf_label_in_post_enabled: false,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false,
  };

  const res = await requestApi<any>(
    `https://x.com/i/api/graphql/h1n9SzVAHCeWyVBcGqOgFA/CombinedLists?variables=${encodeURIComponent(
      JSON.stringify(variables),
    )}&features=${encodeURIComponent(JSON.stringify(features))}`,
    auth,
    'GET',
  );

  if (!res.success) {
    if (res.err instanceof ApiError) {
      console.error('Error details:', res.err.data);
    }
    throw res.err;
  }

  const entries = res.value?.data?.user?.result?.timeline?.timeline?.instructions
    ?.find((instruction: any) => instruction.type === 'TimelineAddEntries')
    ?.entries;

  if (!entries) {
    return {
      success: true,
      value: [],
    };
  }

  const lists: List[] = entries
    .map((entry: any) => {
      const list = entry.content?.itemContent?.list;
      if (!list) return null;

      const userResult = list.user_results?.result;
      if (!userResult) return null;

      return {
        id: list.id_str,
        name: list.name,
        description: list.description,
        memberCount: list.member_count,
        subscriberCount: list.subscriber_count,
        createdAt: new Date(list.created_at),
        bannerUrl: list.custom_banner_media?.media_info?.original_img_url,
        ownerProfile: {
          userId: userResult.rest_id,
          username: userResult.legacy.screen_name,
          name: userResult.legacy.name,
          isBlueVerified: userResult.is_blue_verified,
        },
      };
    })
    .filter((list: List | null): list is List => list !== null);

  return {
    success: true,
    value: lists,
  };
}

export async function getListsByMember(
  userId: string,
  options: GetListMembershipsOptions,
  auth: TwitterAuth,
): Promise<RequestApiResult<{lists: List[], nextCursor?: string}>> {
  const variables = {
    userId,
    count: options.count || 20,
    ...(options.cursor && { cursor: options.cursor }),
  };

  const features = {
    profile_label_improvements_pcf_label_in_post_enabled: false,
    rweb_tipjar_consumption_enabled: true,
    responsive_web_graphql_exclude_directive_enabled: true,
    verified_phone_label_enabled: false,
    creator_subscriptions_tweet_preview_api_enabled: true,
    responsive_web_graphql_timeline_navigation_enabled: true,
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    premium_content_api_read_enabled: false,
    communities_web_enable_tweet_community_results_fetch: true,
    c9s_tweet_anatomy_moderator_badge_enabled: true,
    responsive_web_grok_analyze_button_fetch_trends_enabled: false,
    articles_preview_enabled: true,
    responsive_web_edit_tweet_api_enabled: true,
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    view_counts_everywhere_api_enabled: true,
    longform_notetweets_consumption_enabled: true,
    responsive_web_twitter_article_tweet_consumption_enabled: true,
    tweet_awards_web_tipping_enabled: false,
    creator_subscriptions_quote_tweet_preview_enabled: false,
    freedom_of_speech_not_reach_fetch_enabled: true,
    standardized_nudges_misinfo: true,
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
    rweb_video_timestamps_enabled: true,
    longform_notetweets_rich_text_read_enabled: true,
    longform_notetweets_inline_media_enabled: true,
    responsive_web_enhance_cards_enabled: false,
  };

  const res = await requestApi<any>(
    `https://x.com/i/api/graphql/nRcU3YA0oMdrQYxK0zjkfQ/ListMemberships?variables=${encodeURIComponent(
      JSON.stringify(variables),
    )}&features=${encodeURIComponent(JSON.stringify(features))}`,
    auth,
    'GET',
  );

  if (!res.success) {
    if (res.err instanceof ApiError) {
      console.error('Error details:', res.err.data);
    }
    throw res.err;
  }

  const entries = res.value?.data?.user?.result?.timeline?.timeline?.instructions
    ?.find((instruction: any) => instruction.type === 'TimelineAddEntries')
    ?.entries;

  if (!entries) {
    return {
      success: true,
      value: {
        lists: [],
      },
    };
  }

  // Find the cursor for the next page if it exists
  const cursorEntry = entries.find(
    (entry: any) => entry.content?.cursorType === 'Bottom'
  );
  const nextCursor = cursorEntry?.content?.value;

  const lists: List[] = entries
    .filter((entry: any) => entry.content?.cursorType !== 'Bottom')
    .map((entry: any) => {
      const list = entry.content?.itemContent?.list;
      if (!list) return null;

      const userResult = list.user_results?.result;
      if (!userResult) return null;

      return {
        id: list.id_str,
        name: list.name,
        description: list.description,
        memberCount: list.member_count,
        subscriberCount: list.subscriber_count,
        createdAt: new Date(list.created_at),
        bannerUrl: list.custom_banner_media?.media_info?.original_img_url,
        ownerProfile: {
          userId: userResult.rest_id,
          username: userResult.legacy.screen_name,
          name: userResult.legacy.name,
          isBlueVerified: userResult.is_blue_verified,
        },
      };
    })
    .filter((list: List | null): list is List => list !== null);

  return {
    success: true,
    value: {
      lists,
      ...(nextCursor && { nextCursor }),
    },
  };
}