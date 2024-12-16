import { RequestApiResult } from "./api";
import { TwitterAuth } from "./auth";
import { getUserIdByScreenName } from "./profile";

/**
 * Resolves a user identifier (either username or user ID) to a numeric user ID.
 * If the input is already a valid numeric ID, returns it directly.
 * If it's a username, queries the API to get the corresponding user ID.
 * 
 * @param userIdentifier - Either a numeric user ID or username
 * @param auth - Twitter authentication object
 * @returns Promise resolving to a Result containing the numeric user ID
 */
export async function resolveUserId(
  userIdentifier: string,
  auth: TwitterAuth
): Promise<RequestApiResult<string>> {
  // Basic input validation
  if (!userIdentifier || typeof userIdentifier !== 'string') {
    return {
      success: false,
      err: new Error('User identifier must be a non-empty string')
    };
  }

  // Remove any whitespace
  const cleanIdentifier = userIdentifier.trim();

  // Check if the identifier is already a numeric string
  if (/^\d+$/.test(cleanIdentifier)) {
    return {
      success: true,
      value: cleanIdentifier
    };
  }

  // If not numeric, treat as username and fetch the ID
  try {
    const result = await getUserIdByScreenName(cleanIdentifier, auth);
    if (!result.success) {
      return {
        success: false,
        err: new Error(`Failed to resolve username ${cleanIdentifier}: ${result.err.message}`)
      };
    }

    // Additional validation of the returned ID
    if (!result.value || typeof result.value !== 'string' || !/^\d+$/.test(result.value)) {
      return {
        success: false,
        err: new Error(`Invalid user ID returned for username ${cleanIdentifier}`)
      };
    }

    return {
      success: true,
      value: result.value
    };
  } catch (error) {
    return {
      success: false,
      err: new Error(`Failed to resolve username ${cleanIdentifier}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    };
  }
}