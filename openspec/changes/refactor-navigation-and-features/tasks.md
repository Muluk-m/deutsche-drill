## 已完成 ✅

- [x] SRS 复习页面 UI 重构（`srs-review.tsx`）
  - 现代化卡片式布局
  - 表情图标质量评分
  - 进度条和统计显示优化
  - 空状态和完成状态美化

- [x] **Phase 1: 数据层 + 德语字符输入**
  - [x] 1.1 在 `word.ts` 添加类型定义（DailyGoal, FavoriteWord）
  - [x] 1.2 在 `storageManager.ts` 添加每日目标函数（getDailyGoal, setDailyGoal, checkGoalCompletion）
  - [x] 1.3 在 `storageManager.ts` 添加生词本函数（getFavorites, addFavorite, removeFavorite, isFavorite 等）
  - [x] 2.1 创建 `GermanKeyboard.tsx` 组件（完整版 + 紧凑版）
  - [x] 2.2 集成到 `AnswerInput.tsx` 和 `srs-review.tsx`

---

## 3. "我的" 页面
- [ ] 3.1 创建 `app/routes/profile.tsx` 页面
- [ ] 3.2 实现每日目标设置 UI（10/20/30/50 可选）
- [ ] 3.3 实现学习统计展示（总学习词数、今日学习、连续学习天数、正确率）
- [ ] 3.4 添加生词本入口

## 4. 生词本功能
- [ ] 4.1 创建 `app/routes/favorites.tsx` 页面
- [ ] 4.2 实现生词列表展示（按添加时间排序）
- [ ] 4.3 在学习/复习页面添加 "加入生词本" 按钮
- [ ] 4.4 实现生词本专项复习功能

## 5. 首页优化
- [ ] 5.1 在 LearningDashboard 添加每日目标进度显示
- [ ] 5.2 目标达成时显示庆祝动画
- [ ] 5.3 单元列表改为可折叠分组展示（5 个一组）

## 6. 底部导航更新
- [ ] 6.1 修改 `BottomNav.tsx` 添加 "我的" Tab（替换 "复习"）
- [ ] 6.2 更新路由配置 `routes.ts` 添加 profile 和 favorites 路由

## 7. 整体 UI 统一
- [ ] 7.1 其他测试页面 UI 风格统一（参考 srs-review.tsx 的新风格）
- [ ] 7.2 学习页面 (learn.tsx) UI 优化
