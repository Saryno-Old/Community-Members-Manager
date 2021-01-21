import * as Joi from 'joi';
import {
  IDValidator,
} from './community-member.validator';

export const FindCommunityMemberByIdsValidator = Joi.object({
  user_id: IDValidator.required(),
  community_id: IDValidator.required(),
}).required();

export const FindCommunityMembersByIdValidator = Joi.object({
  community_id: IDValidator.required()
}).required();

export const QueryCommunityMembersValidator = Joi.object({
  // user_ids: Joi.array().items(IDValidator.required()).optional(),
  // community_ids: Joi.array().items(IDValidator.required()).optional(),

  user_id: IDValidator.optional(),
  community_id: IDValidator.optional(),

  before: IDValidator.optional().default(Date.now),
  after: IDValidator.optional().default(0),
}).required();