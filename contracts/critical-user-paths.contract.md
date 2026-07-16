# Critical User Paths Contract v1.0

## Contract CP-001 营业状态

Given:
- June 在后台修改今日营业状态。

Expect:
- 前台立即展示最新状态。
- 状态包含时间和更新时间。
- 无缓存导致旧状态继续展示。

Failure:
- API 失败必须显示失败状态。
- 不允许假装保存成功。

## Contract CP-002 菜单价格

Given:
- June 修改商品售价。

Expect:
- 前台展示同一价格源。
- 订单计算使用最新价格。

Failure:
- 价格为空、负数、格式错误禁止保存。
- 已创建订单价格不可被历史修改影响。

## Contract CP-003 订单幂等

Given:
- 用户连续点击提交订单两次。

Expect:
- 只产生一个订单。
- 用户收到明确状态。

Failure:
- 网络重试不得重复扣款或重复创建。

## Contract CP-004 商品售罄

Given:
- 商品库存不足。

Expect:
- 后台可标记售罄。
- 前台禁止继续正常购买。

Failure:
- 前后台状态不一致必须报警。

## Contract CP-005 PR 验收

任何 PR 必须回答：

1. 改变了什么业务行为？
2. 对应哪个 contract？
3. 测试如何证明？
4. 失败如何恢复？
5. 为什么现在必须做？
