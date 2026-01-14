import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("unit/:id", "routes/unit.$id.tsx"),
	route("learn", "routes/learn.tsx"),
	route("review", "routes/review.tsx"),
	route("random", "routes/random.tsx"),
	
	// SRS 和错题本
	route("srs-review", "routes/srs-review.tsx"),
	route("mistakes", "routes/mistakes.tsx"),
	
	// 我的 & 生词本
	route("profile", "routes/profile.tsx"),
	route("favorites", "routes/favorites.tsx"),
	
	// 测试模式
	route("test-modes", "routes/test-modes.tsx"),
	route("test-listening", "routes/test-listening.tsx"),
	route("test-choice", "routes/test-choice.tsx"),
	route("test-cn-to-de", "routes/test-cn-to-de.tsx"),
	route("test-cloze", "routes/test-cloze.tsx"),
	
	// 语法练习
	route("practice-articles", "routes/practice-articles.tsx"),
	route("practice-plural", "routes/practice-plural.tsx"),
	route("practice-verbs", "routes/practice-verbs.tsx"),
] satisfies RouteConfig;
