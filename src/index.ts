import { GraphQLClient } from 'graphql-request';
import { GQLPullRequest, GQLRepository, GQLQuery, GQLRelease, GQLReleaseEdge } from './types/githubApi';
import { option } from 'fp-ts';
import R from 'ramda';
import prog from 'caporal'

const query = (config:  Config) => `{
  repository(owner: "${config.repo.owner}", name: "${config.repo.name}") {
    pullRequests(last: 10, states:MERGED, baseRefName:"${config.options!.baseBranch}") {
      edges {
        node {
          title,
          mergedAt
        }
      }
    },
    releases(first:10, orderBy:{field:CREATED_AT, direction:DESC} ) {
      edges {
        node {
          tag {
            name
          },
          createdAt,
          isPrerelease
        }
      }
    }
  }
}`

export type Repo = {
  owner: string,
  name: string
};

export type Options =  {
  baseBranch: string
  // things
};

export type Config = {
  apiUrl: string,
  bearerToken: string,
  repo: Repo,
  options?: Options 
}

if (require.main === module) {
  prog
    .description('Our super cool CLI thing')
    .argument('<apiUrl>', 'Github API endpoint', prog.STRING, 'https://github.com/api/graphql')
    .argument('<bearerToken>', 'API Token')
    .argument('<owner>', 'Repo owner')
    .argument('<name>', 'Repo name')
    .option('-b, --branch <baseBranch>', 'Branch', prog.STRING, 'master')
    .action(({ apiUrl, bearerToken, owner, name }, { baseBranch }) => {
      return doIt({
        apiUrl,
        bearerToken,
        repo: {
          owner,
          name
        },
        options: {
          baseBranch
        }
      })
    })

  prog.parse(process.argv);
}

export default async function doIt(config: Config) {
  const client = new GraphQLClient(config.apiUrl, {
    headers: {
      Authorization: `Bearer ${config.bearerToken}`
    }
  });

  const { repository } = await (client.request<GQLQuery>(query(config)))
  const a = option.fromNullable(repository)
    .map(repository => repository.releases)
    .mapNullable(releases => releases.edges)
    .map(edges => (edges.filter(Boolean) as GQLReleaseEdge[]))
    .map(edges => edges.map(edge => edge.node).filter(Boolean) as GQLRelease[])
    .filter(edges => edges.length !== 0)
    .mapNullable(releases => {
      const oldReleases = R.tail(releases);
      return (process.env.BUILD_TYPE === 'PRE-RELEASE') ? R.head(oldReleases) : R.find(r => !r.isPrerelease, oldReleases)
    })
    // .map(applicableRelease => {

    // });

  console.log(a);
}