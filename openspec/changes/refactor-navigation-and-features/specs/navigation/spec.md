## ADDED Requirements

### Requirement: Bottom Navigation Structure
The application SHALL provide a 4-tab bottom navigation with the following items: Home (首页), Learn (学习), Test (测试), Profile (我的).

#### Scenario: User navigates between tabs
- **WHEN** user taps on a navigation tab
- **THEN** the corresponding page is displayed and the tab is highlighted as active

#### Scenario: Review badge display
- **WHEN** there are due words for SRS review
- **THEN** the Learn tab SHALL display a badge with the count of due words

---

### Requirement: Home Page Layout
The home page SHALL be organized into three distinct sections: Learning Dashboard, Core Actions, and Unit List.

#### Scenario: Learning Dashboard displays progress
- **WHEN** user opens the home page
- **THEN** the dashboard shows: daily goal progress (X/Y words), due review count, and streak days

#### Scenario: Core Actions section
- **WHEN** user views the Core Actions section
- **THEN** exactly three action buttons are displayed: "继续学习", "智能复习", "开始测试"

#### Scenario: Unit List with collapsible groups
- **WHEN** user views the Unit List section
- **THEN** units are grouped (5 units per group) with expand/collapse controls
- **AND** the first group is expanded by default

---

### Requirement: Daily Learning Goal
The system SHALL allow users to set a daily learning goal and track progress toward it.

#### Scenario: Set daily goal
- **WHEN** user selects a goal option (10, 20, 30, or 50 words)
- **THEN** the goal is saved and displayed on the home page dashboard

#### Scenario: Goal progress tracking
- **WHEN** user learns a new word (not previously learned)
- **THEN** the daily goal progress increments by 1

#### Scenario: Goal achievement celebration
- **WHEN** user completes the daily goal
- **THEN** a celebration animation is displayed
- **AND** the dashboard shows "目标已达成" status

#### Scenario: Goal resets daily
- **WHEN** a new calendar day begins
- **THEN** the daily progress resets to 0 while keeping the goal target unchanged

---

### Requirement: Favorites (生词本) Feature
The system SHALL allow users to mark words as favorites and review them separately.

#### Scenario: Add word to favorites
- **WHEN** user taps the "加入生词本" button on a word
- **THEN** the word is added to favorites with timestamp
- **AND** a success feedback is shown

#### Scenario: Remove word from favorites
- **WHEN** user removes a word from favorites list
- **THEN** the word is removed from favorites storage

#### Scenario: View favorites list
- **WHEN** user opens the favorites page
- **THEN** all favorited words are displayed sorted by added date (newest first)
- **AND** each word shows: German word, Chinese meaning, added date

#### Scenario: Practice favorites
- **WHEN** user taps "复习生词" on favorites page
- **THEN** user is redirected to test-modes with favorites filter applied

---

### Requirement: German Special Character Input
The system SHALL provide quick access to German special characters (ä, ö, ü, ß, Ä, Ö, Ü) during text input.

#### Scenario: Character bar visibility
- **WHEN** an answer input field is focused
- **THEN** a character bar with German special characters is displayed below the input

#### Scenario: Insert character
- **WHEN** user taps a special character button
- **THEN** the character is inserted at the current cursor position in the input field

---

### Requirement: Profile Page
The system SHALL provide a Profile page containing user statistics, goal settings, and favorites access.

#### Scenario: View learning statistics
- **WHEN** user opens the Profile page
- **THEN** the following statistics are displayed: total words learned, today's words learned, streak days, overall accuracy

#### Scenario: Access goal settings
- **WHEN** user taps on goal setting section
- **THEN** goal options (10/20/30/50) are displayed for selection

#### Scenario: Access favorites
- **WHEN** user taps on favorites section
- **THEN** user is navigated to the favorites page

---

### Requirement: Test Modes Consolidation
The test-modes page SHALL consolidate all testing options including word tests and grammar exercises.

#### Scenario: Word test section
- **WHEN** user views test-modes page
- **THEN** word tests are displayed: 听写模式, 选择题, 中译德, 填空题

#### Scenario: Grammar practice section
- **WHEN** user views test-modes page
- **THEN** grammar exercises are displayed: 冠词练习, 复数练习, 动词变位

#### Scenario: Clear section separation
- **WHEN** user views test-modes page
- **THEN** word tests and grammar exercises are visually separated with distinct section headers


