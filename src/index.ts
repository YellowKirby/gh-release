import * as R from 'ramda';
import { GraphQLClient } from 'graphql-request';
import { GQLPullRequest, GQLRepository, GQLQuery, GQLRelease, GQLReleaseEdge } from './types/githubApi';
import { Maybe } from 'tsmonad';

const startTag = 'TAG';
const endTag = null;

const client = new GraphQLClient('ENDPOINT', {
  headers: {
    Authorization: 'Bearer NO'
  }
});

const query = `{
  repository(owner: "ORG", name: "REPO") {
    pullRequests(last: 5, states:MERGED, baseRefName:"BRANCH") {
      edges {
        node {
          title,
          mergedAt
        }
      }
    },
    releases(first:5, orderBy:{field:CREATED_AT, direction:DESC} ) {
      edges {
        node {
          tag {
            name
          },
          createdAt
        }
      }
    }
  }
}`

export default async function doIt() {
  const { repository } = await (client.request<GQLQuery>(query))
  const maybeThing = Maybe.maybe(repository);

  const a = maybeThing.lift(repository => repository.releases)
    .chain(releases => Maybe.maybe(releases.edges))

  
  console.log(a);

  // console.log(edges.value);

  // const edges = R.may

  //   R.filter<GQLReleaseEdge | null>(edge => {
  //     if (edge) {
  //       return edge.node!.tag!.name === startTag
  //     }

  //     return false;
  //   }, edges)
  // })
}
