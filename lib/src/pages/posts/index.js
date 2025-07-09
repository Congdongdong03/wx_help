"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const OptimizedPostList_1 = require("../../components/OptimizedPostList");
const postUtils_1 = require("../../utils/postUtils");
require("./index.scss");
const PostsPage = () => {
    const [posts, setPosts] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const fetchPosts = (0, react_1.useCallback)(async (page) => {
        try {
            setLoading(true);
            const response = await taro_1.default.request({
                url: `${process.env.API_BASE_URL}/api/posts`,
                method: "GET",
                data: {
                    page,
                    limit: 10,
                },
                header: {
                    Authorization: `Bearer ${taro_1.default.getStorageSync("token")}`,
                },
            });
            if (response.statusCode === 200) {
                const newPosts = response.data.posts.map((post) => ({
                    id: post._id,
                    title: post.title,
                    description: post.description,
                    category: post.category,
                    price: post.price,
                    images: post.images || [],
                    createdAt: post.createdAt,
                }));
                setPosts((prev) => [...prev, ...newPosts]);
            }
        }
        catch (error) {
            (0, postUtils_1.handlePostError)(error);
        }
        finally {
            setLoading(false);
        }
    }, []);
    const handlePostClick = (id) => {
        taro_1.default.navigateTo({
            url: `/pages/detail/index?id=${id}`,
        });
    };
    return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "posts-page", children: (0, jsx_runtime_1.jsx)(OptimizedPostList_1.OptimizedPostList, { posts: posts, onPostClick: handlePostClick, loading: loading }) }));
};
exports.default = PostsPage;
//# sourceMappingURL=index.js.map