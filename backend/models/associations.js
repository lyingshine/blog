// 模型关联配置
const User = require('./User');
const Inspiration = require('./Inspiration');
const InspirationLike = require('./InspirationLike');
const InspirationComment = require('./InspirationComment');

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

module.exports = {
  User,
  Inspiration,
  InspirationLike,
  InspirationComment
};