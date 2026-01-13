import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("unit/:id", "routes/unit.$id.tsx"),
	route("learn", "routes/learn.tsx"),
	route("review", "routes/review.tsx"),
	route("random", "routes/random.tsx"),
] satisfies RouteConfig;
