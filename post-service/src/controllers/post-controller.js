const Post = require("../models/Post");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { validatePostCreation } = require("../utils/validation");

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");
  try {
    const { error } = validatePostCreation(req.body);
    if (error) {
      logger.warn("Validation error: %o", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { title, content, mediaIds } = req.body;
    const newPost = new Post({
      user: req.user.userId, // Assuming user ID is stored in req.user
      title,
      content,
      mediaIds: mediaIds || [],
    });
    await newPost.save();
    await publishEvent(
      "post.created",
      JSON.stringify({
        postId: newPost._id.toString(),
        userId: newPost.user.toString(),
        title: newPost.title,
        content: newPost.content,
        mediaIds: newPost.mediaIds,
        createdAt: newPost.createdAt,
      })
    );
    await invalidatePostCache(req, newPost._id.toString());
    logger.info("Post created successfully:", newPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    logger.error("Error creating post: %o", error);
    return res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalNoOfPosts = await Post.countDocuments();
    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };
    // save your posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
    res.json(result);
  } catch (error) {
    logger.error("Error getting posts: %o", error);
    return res.status(500).json({
      success: false,
      message: "Error getting posts",
      error: error.message,
    });
  }
};
const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cachedKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cachedKey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    await req.redisClient.setex(cachedKey, 3600, JSON.stringify(post));
    res.json(post);
  } catch (error) {
    logger.error("Error getting post: %o", error);
    return res.status(500).json({
      success: false,
      message: "Error getting post by ID",
      error: error.message,
    });
  }
};
const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    // PUBLISH post deleted method->
    await publishEvent(
      "post.deleted",
      JSON.stringify({
        postId: post._id,
        userId: req.user.userId,
        mediaIds: post.mediaIds,
      })
    );
    logger.info("Post deleted successfully: %o", post);
    await invalidatePostCache(req, req.params.id);
    res.status(204).json({
      success: true,
      message: `Post deleted sucessfully`,
    });
  } catch (error) {
    logger.error("Error deleting post: %o", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting post by ID",
      error: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};
