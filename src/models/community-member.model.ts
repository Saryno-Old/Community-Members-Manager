import { Document, Model, model, Schema } from 'mongoose';
import { SnowflakeID, SnowflakeSchemaID } from './id';

const CommunityMemberSchema = new Schema(
  {
    _id: { type: SnowflakeSchemaID },

    community_id: { type: SnowflakeSchemaID, required: true },

    user_id: { type: SnowflakeSchemaID, required: true },
  
    roles_ids: [{type: SnowflakeSchemaID, }],

    nickname: { type: String, required: false },
  },
  { versionKey: false },
);

CommunityMemberSchema.index({
  community_id: 1,
  user_id: 1,
}, { unique: true });

CommunityMemberSchema.index({
  community_id: 1,
});

CommunityMemberSchema.index({
  user_id: 1,
});

export interface ICommunityMember extends Document {
  _id: SnowflakeID;

  // eslint-disable-next-line
  community_id: SnowflakeID;

  // eslint-disable-next-line
  user_id: SnowflakeID;

  // eslint-disable-next-line
  roles_ids: SnowflakeID[];

  nickname?: string;

  json(): JSON;
}

export interface ICommuniyStatics extends Model<ICommunityMember> {
  empty: never;
}

CommunityMemberSchema.methods.json = function() {
  const member = this as ICommunityMember;

  return {
    id: member._id,
    community_id: member.community_id,
    user_id: member.user_id,
    roles_ids: member.roles_ids,
    nickname: member.nickname
  };
};

export const CommunityMember = model<ICommunityMember>(
  'CommunityMember',
  CommunityMemberSchema,
  'communityMembers',
);
