import * as Router from 'koa-router';
import {
  FindCommunityMemberByIdsValidator,
  QueryCommunityMembersValidator,
} from '../validators/query-community-members.validator';
import { Snowflakes } from '../utils/snowflakes';
import {
  ICommunityMember,
  CommunityMember,
} from '../models/community-member.model';
// import { JoinCommunityValidator } from '../validators/join-community.validator';
// import { LeaveCommunityValidator } from '../validators/leave-community.validator';
import { MongoError } from 'mongodb';
import * as Joi from 'joi';
import { EventType, sendEvent } from '../events/events';

const CommunityMembersRouter = new Router({
  prefix: '/members',
});

CommunityMembersRouter.get('query_communities', '/', async ctx => {
  const communityQuery = await QueryCommunityMembersValidator.validateAsync(
    ctx.request.query,
  ).catch(err => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
  });

  const query = {
    _id: {
      $lte: Snowflakes.encode(communityQuery.before),
      $gte: Snowflakes.encode(communityQuery.after),
    },
  };

  if (communityQuery.user_id)
    query['user_id'] = communityQuery.user_id;
  if (communityQuery.community_id)
    query['community_id'] = communityQuery.community_id;

  const members: ICommunityMember[] = await CommunityMember.find(query)
    .limit(communityQuery.limit)
    .skip(communityQuery.skip)
    .exec();

  ctx.body = members.map(member => member.json());
});

CommunityMembersRouter.get(
  'get_community_member',
  '/:community_id/:user_id',
  async ctx => {
    const query = await FindCommunityMemberByIdsValidator.validateAsync(
      ctx.params,
    ).catch(err => {
      ctx.throw(400, {
        error: {
          type: 'validation-error',
          details: err.details,
        },
      });
    });

    const community = await CommunityMember.findOne(query).exec();

    if (!community) {
      return ctx.throw(404, { error: { type: 'Not Found', details: { message: `CommunityMembers not found` }} });
    }

    ctx.body = community.json();
  },
);

CommunityMembersRouter.post('join_community', '/:community_id/:user_id', async ctx => {
  const query = await FindCommunityMemberByIdsValidator.validateAsync(
    ctx.params,
  ).catch((err: Joi.ValidationError) => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
  });

  const member = await new CommunityMember({
    _id: Snowflakes.next(),
    ...query,
  })
    .save()
    .catch((err: MongoError) => {
      if (err.name === 'MongoError' && err.code === 11000) {
        return ctx.throw(500, {
          error: {
            type: 'database',
            details: {
              message: `Entry for user_id ${query.user_id} and community_id ${query.community_id} already exists`,
            },
          },
        });
      }
      ctx.throw(500);
    });

  if (!member) return ctx.throw(500);

  ctx.body = member.json();
  ctx.response.status = 201;

  setImmediate(async () => {
    sendEvent(EventType.COMMUNITY_JOIN, { user: member.user_id, community: member.community_id });
  });
});

CommunityMembersRouter.delete('leave_community', '/:community_id/:user_id', async (ctx) => {
  const query = await FindCommunityMemberByIdsValidator.validateAsync(
    ctx.params,
  ).catch((err: Joi.ValidationError) => {
    ctx.throw(400, {
      error: {
        type: 'validation-error',
        details: err.details,
      },
    });
  });

  const result = await CommunityMember.deleteOne(query).exec().catch((err: MongoError) => {
    ctx.throw(500, { error: { type: 'database', details: err }});
  });

  if(result.n === 0 && result.ok === 1) {
    ctx.response.status = 304;
    ctx.body = '';
    return;
  }

  ctx.response.status = 200;
  ctx.body = '';

  setImmediate(async () => {
    sendEvent(EventType.COMMUNITY_LEAVE, { user: query.user_id, community: query.community_id });
  });
});

// CommunityMembersRouter.post('join_community', '/', async ctx => {
//   const communityObj = await CreateCommunityMembersValidator.validateAsync(
//     ctx.request.body,
//   ).catch(err => {
//     ctx.throw(400, JSON.stringify(err));
//   });

//   const community = await new CommunityMembers({
//     _id: Snowflakes.next(),
//     ...communityObj,
//   })
//     .save()
//     .catch((err: MongoError) => {
//       if (err.name === 'MongoError' && err.code === 11000) {
//         ctx.throw(500, 'This should never happened...');
//       }
//       ctx.throw(500, { error: err.errmsg });
//       return null;
//     });

//   ctx.response.status = 201;
//   ctx.body = community.json();
// });

// CommunityMembersRouter.patch('patch_community', '/:id', async ctx => {
//   console.log(ctx.params, ctx.body);
//   const [{ id }, patch] = await Promise.all([
//     FindCommunityMembersByIdValidator.validateAsync(ctx.params),
//     LeaveCommunityValidator.validateAsync(ctx.request.body),
//   ]).catch((err: Joi.ValidationError) => {
//     console.log(err);
//     ctx.body = err;
//     ctx.response.status = 500;
//     return [{ id: null }, null];
//   });

//   if (!id) return;

//   const update = await CommunityMembers.updateOne({ _id: id }, patch).exec();

//   if (!update) {
//     return ctx.throw(404);
//   }

//   if (update.n == 1 && update.nModified == 0) {
//     return (ctx.response.status = 304);
//   }

//   ctx.response.status = 202;
// });

export { CommunityMembersRouter };
