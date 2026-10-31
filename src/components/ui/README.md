# UI 부품과 규칙

> 화면은 이 폴더의 부품으로 만든다. 버튼·입력칸·모달·카드를 화면에서 직접 그리지 않는다.
> 모든 부품은 개발 서버의 `/dev/ui`에서 한눈에 본다.

## 원칙

- **한 화면에 주 행동(`UiButton` primary)은 하나.** 나머지는 secondary·ghost.
- **주황은 주 행동과 켜진 탭에만.** 상태 표시는 `UiBadge`, 강조는 굵기로.
- **평평하게.** 그림자 없이 바탕 밝기(`canvas` → `surface` → `surface-2`)와 `line`으로 층을 나눈다.
- **모서리는 두 가지.** 작은 것 8px(`rounded-lg` 이하), 나머지 12px(`rounded-xl`), 원(`rounded-full`).
- **누르는 곳은 44px 이상.** `UiButton` md 이상, `UiIconButton`을 쓰면 저절로 지켜진다.

## 토큰 (`tailwind.config.cjs`)

| 이름 | 쓰는 곳 |
|---|---|
| `bg-canvas` | 화면 바탕 |
| `bg-surface` | 카드·시트 |
| `bg-surface-2` | 카드 안의 칸, 눌린 상태, 보조 버튼 |
| `border-line` / `line-strong` | 구분선 / 강조 구분선 |
| `text-fg` / `fg-muted` / `fg-subtle` | 본문 / 보조 / 시간·개수 |
| `primary` / `danger` / `success` | 주 행동 / 삭제·패배 / 승리·확정. `-soft`는 옅은 바탕, `-fg`는 글자색 |
| `z-header` < `z-nav` < `z-sheet` < `z-dialog` < `z-toast` | 겹치는 순서. 숫자(`z-[9999]`)를 쓰지 않는다 |

글자는 크기·굵기를 직접 고르지 않고 역할 클래스를 쓴다: `t-display` `t-title` `t-heading` `t-body` `t-label` `t-caption` `t-micro`.

## 부품

| 부품 | 언제 |
|---|---|
| `UiTopBar` | 모든 화면 맨 위. 탭 화면은 `title`만, 들어간 화면은 `back` |
| `UiButton` | 모든 버튼. `variant`(primary·secondary·ghost·danger), `size`(sm·md·lg), `block`, `loading`, `icon`, `to` |
| `UiIconButton` | 아이콘만 있는 버튼. `label`은 필수 |
| `UiInput` / `UiSelect` / `UiField` | 입력. `label`, `hint`, `error`, `optional` |
| `UiCard` | 한 덩어리 정보. 누르면 들어가는 카드는 `to`·`interactive` |
| `UiList` + `UiListItem` | 설정·알림·사람 목록 |
| `UiSection` | 화면 안의 묶음 (제목 + 오른쪽 행동) |
| `UiChip` / `UiBadge` / `UiTabs` | 고르기 / 상태 / 보기 바꾸기 |
| `UiAvatar` | 프로필 사진. 없거나 깨지면 첫 글자 |
| `UiEmptyState` | 비었을 때: 무엇이 없는지 + 다음 행동 |
| `UiSkeleton` / `UiListSkeleton` | 불러오는 동안 실제 모양 그대로 자리 표시 (빛이 지나간다) |
| `UiSpinner` | 버튼·작은 곳의 기다림. 화면 전체를 스피너로 막지 않는다 |
| `UiSheet` | 목록·상세·고르기처럼 내용이 있는 것. 아래에서 올라온다 |
| `UiDialog` / `confirmDialog()` | 짧은 확인 하나 (삭제할까요?). `await confirmDialog({...})` |

시트·다이얼로그는 뒤로가기·바깥 누르기·Esc로 닫히고, 열린 동안 뒤 화면이 스크롤되지 않는다(`useOverlay`).

## 기다림

- **화면을 불러올 때는 스켈레톤.** 실제 내용과 같은 모양·크기로. "불러오는 중..." 글자와 큰 스피너를 쓰지 않는다
- **버튼은 `loading`.** 글자 자리를 지킨 채 스피너가 올라간다 (폭이 흔들리지 않게)
- **내용이 들어오면 `ui-appear`** 로 살짝 올라오며 나타난다
- 화면 이동이 150ms를 넘으면 맨 위에 얇은 진행 막대가 저절로 뜬다 (`RouteProgress`)
- 움직임 줄이기 설정이면 빛·올라오기를 멈춘다

## 문구

- **말투는 "~해요"로 통일.** "~합니다", "~하십시오"를 쓰지 않는다.
- **버튼은 동사로, 결과를 말한다.** "확인" 대신 "삭제", "저장", "신청".
- **빈 값은 숨긴다.** "연령 -"처럼 대시를 보여주지 않는다.
- **비었을 때는 다음 행동을 준다.** "기록이 없습니다"로 끝내지 않고 버튼을 둔다.
- **오류는 무엇을 하면 되는지 말한다.** "실패했습니다" 대신 "잠시 뒤 다시 시도해주세요", "아이디를 적어주세요".
