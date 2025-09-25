// 模型关联配置
const User = require('./User');
const Inspiration = require('./Inspiration');
const InspirationLike = require('./InspirationLike');
const InspirationComment = require('./InspirationComment');
const InspirationCommentLike = require('./InspirationCommentLike');
const InspirationShare = require('./InspirationShare');

// 用户和灵感的关联
User.hasMany(Inspiration, {
  foreignKey: 'user_id',
  as: 'inspirations'
});

Inspiration.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author'
});

// 用户和灵感点赞的关联
User.hasMany(InspirationLike, {
  foreignKey: 'user_id',
  as: 'inspirationLikes'
});

InspirationLike.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 灵感和点赞的关联
Inspiration.hasMany(InspirationLike, {
  foreignKey: 'inspiration_id',
  as: 'likes'
});

InspirationLike.belongsTo(Inspiration, {
  foreignKey: 'inspiration_id',
  as: 'inspiration'
});

// 用户和灵感评论的关联
User.hasMany(InspirationComment, {
  foreignKey: 'user_id',
  as: 'inspirationComments'
});

InspirationComment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'author'
});

// 灵感和评论的关联
Inspiration.hasMany(InspirationComment, {
  foreignKey: 'inspiration_id',
  as: 'comments'
});

InspirationComment.belongsTo(Inspiration, {
  foreignKey: 'inspiration_id',
  as: 'inspiration'
});

// 评论的自关联（回复功能）
InspirationComment.hasMany(InspirationComment, {
  foreignKey: 'parent_id',
  as: 'replies'
});

InspirationComment.belongsTo(InspirationComment, {
  foreignKey: 'parent_id',
  as: 'parent'
});

// 灵感转发关联
User.hasMany(InspirationShare, {
  foreignKey: 'user_id',
  as: 'inspirationShares'
});

InspirationShare.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Inspiration.hasMany(InspirationShare, {
  foreignKey: 'inspiration_id',
  as: 'shares'
});

Inspiration.hasMany(InspirationShare, {
  foreignKey: 'original_inspiration_id',
  as: 'originalShares'
});

InspirationShare.belongsTo(Inspiration, {
  foreignKey: 'inspiration_id',
  as: 'inspiration'
});

InspirationShare.belongsTo(Inspiration, {
  foreignKey: 'original_inspiration_id',
  as: 'originalInspiration'
});

// 灵感自引用关联（转发）
Inspiration.belongsTo(Inspiration, {
  foreignKey: 'original_inspiration_id',
  as: 'originalInspiration'
});

Inspiration.hasMany(Inspiration, {
  foreignKey: 'original_inspiration_id',
  as: 'shareInspirations'
});

// 评论点赞关联
User.hasMany(InspirationCommentLike, {
  foreignKey: 'user_id',
  as: 'inspirationCommentLikes'
});

InspirationCommentLike.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

InspirationComment.hasMany(InspirationCommentLike, {
  foreignKey: 'comment_id',
  as: 'likes'
});

InspirationCommentLike.belongsTo(InspirationComment, {
  foreignKey: 'comment_id',
  as: 'comment'
});

module.exports = {
  User,
  Inspiration,
  InspirationLike,
  InspirationComment,
  InspirationCommentLike,
  InspirationShare
};