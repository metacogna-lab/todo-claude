import type { GraphQLFormattedError } from "graphql";

export function formatGraphQLError(error: GraphQLFormattedError): GraphQLFormattedError {
  return {
    message: error.message,
    ...(error.locations ? { locations: error.locations } : {}),
    ...(error.path ? { path: error.path } : {}),
    extensions: {
      code: (error.extensions?.code as string | undefined) ?? "INTERNAL_ERROR",
      details: error.extensions?.details ?? error.extensions?.exception,
    },
  };
}
