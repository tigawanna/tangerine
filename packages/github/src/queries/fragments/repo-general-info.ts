import { graphql } from "../../graphql";

/**
 * Repository overview fields (Relay `GeneralInfo_info`).
 */
export const RepoGeneralInfoFragment = graphql(`
  fragment RepoGeneralInfo on Repository {
    id
    url
    description
    nameWithOwner
    openGraphImageUrl
    projectsUrl
    projectsResourcePath
    pushedAt
    diskUsage
    homepageUrl
    resourcePath
    visibility
    viewerPermission
    repositoryTopics(first: 20) {
      nodes {
        id
        topic {
          name
        }
      }
    }
    languages(first: 20) {
      nodes {
        color
        name
        id
      }
    }
    primaryLanguage {
      color
      id
      name
    }
    forkCount
    stargazerCount
    hasDiscussionsEnabled
    hasIssuesEnabled
    hasProjectsEnabled
    hasWikiEnabled
    forkingAllowed
    isArchived
    isDisabled
    isFork
    isLocked
    isPrivate
    isTemplate
    isUserConfigurationRepository
    viewerHasStarred
    viewerCanAdminister
  }
`);
