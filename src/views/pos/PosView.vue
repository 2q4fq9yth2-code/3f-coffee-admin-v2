<template>
  <div class="pos-page">
    <!-- 顶部栏 -->
    <div class="pos-header">
      <div class="pos-title">
        <span class="pos-logo">☕</span>
        <span>收银台</span>
      </div>
      <div class="pos-actions">
        <el-button @click="$router.push('/dashboard')" text>
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
      </div>
    </div>

    <div class="pos-body">
      <!-- 左侧：商品选择区 -->
      <div class="pos-products">
        <!-- 分类标签 -->
        <div class="category-tabs">
          <div
            v-for="cat in categories"
            :key="cat"
            :class="['cat-tab', { active: activeCategory === cat }]"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </div>
        </div>

        <!-- 商品网格 -->
        <div class="product-grid">
          <div
            v-for="product in filteredProducts"
            :key="product._id"
            class="product-btn"
            @click="addToCart(product)"
          >
            <div class="p-name">{{ product.name }}</div>
            <div class="p-price">¥{{ (product.price / 100).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：购物车 -->
      <div class="pos-cart">
        <!-- 订单信息 -->
        <div class="cart-header">
          <div class="order-info-row">
            <span class="order-label">订单号</span>
            <span class="order-no">{{ orderNo }}</span>
          </div>
          <div class="order-info-row">
            <span class="order-label">桌台</span>
            <el-select v-model="cart.tableId" placeholder="选择桌台" size="small" clearable style="width: 120px">
              <el-option v-for="t in tables" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </div>
        </div>

        <!-- 购物车列表 -->
        <div class="cart-items">
          <div v-if="cart.items.length === 0" class="cart-empty">
            <div class="empty-icon">🛒</div>
            <div class="empty-text">点击左侧商品添加</div>
          </div>

          <div
            v-for="(item, idx) in cart.items"
            :key="idx"
            class="cart-item"
          >
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">¥{{ (item.price / 100).toFixed(2) }}</div>
            </div>
            <div class="item-controls">
              <el-button
                size="small"
                circle
                @click="decreaseItem(idx)"
                :disabled="item.quantity <= 1"
              >
                <el-icon><Minus /></el-icon>
              </el-button>
              <span class="item-qty">{{ item.quantity }}</span>
              <el-button size="small" circle @click="increaseItem(idx)">
                <el-icon><Plus /></el-icon>
              </el-button>
              <el-button size="small" circle type="danger" text @click="removeItem(idx)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="cart-remark">
          <el-input
            v-model="cart.remark"
            placeholder="备注（选填）"
            size="small"
            clearable
          />
        </div>

        <!-- 费用汇总 -->
        <div class="cart-summary">
          <div class="summary-row">
            <span>商品件数</span>
            <span>{{ cart.itemCount }} 件</span>
          </div>
          <div class="summary-row">
            <span>原价合计</span>
            <span>¥{{ cart.originalTotal }}</span>
          </div>
          <div class="summary-row discount" v-if="cart.discount > 0">
            <span>优惠</span>
            <span class="amount negative">-¥{{ cart.discount }}</span>
          </div>
          <div class="summary-row total">
            <span>应付金额</span>
            <span class="total-amount">¥{{ cart.total }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="cart-actions">
          <el-button @click="clearCart" :disabled="cart.items.length === 0">
            清空
          </el-button>
          <el-button type="primary" :disabled="cart.items.length === 0" @click="submitOrder">
            提交订单
          </el-button>
          <el-button
            v-if="cart.items.length > 0"
            type="success"
            @click="showPayDialog = true"
          >
            立即收款
          </el-button>
        </div>
      </div>
    </div>

    <!-- 收款对话框 -->
    <el-dialog v-model="showPayDialog" title="收款" :width="380">
      <div class="pay-amount-display">
        <div class="pay-label">应收金额</div>
        <div class="pay-amount">¥{{ cart.total }}</div>
      </div>

      <div class="pay-methods">
        <div class="pay-method" v-for="method in payMethods" :key="method.value">
          <el-radio v-model="selectedPayMethod" :label="method.value">
            <span class="method-icon">{{ method.icon }}</span>
            <span class="method-name">{{ method.name }}</span>
          </el-radio>
        </div>
      </div>

      <div class="pay-actions">
        <el-button @click="showPayDialog = false">取消</el-button>
        <el-button type="success" size="large" @click="confirmPay" style="flex: 1">
          确认收款 ¥{{ cart.total }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 收款成功对话框 -->
    <el-dialog v-model="showSuccessDialog" title="收款成功" :width="340" :close-on-click-modal="false">
      <div class="success-content">
        <div class="success-icon">✅</div>
        <div class="success-amount">¥{{ cart.total }}</div>
        <div class="success-method">{{ currentPayMethodName }} 支付成功</div>
      </div>
      <template #footer>
        <el-button @click="newOrder">继续收款</el-button>
        <el-button type="primary" @click="printAndClose">打印小票并完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

const activeCategory = ref('咖啡')
const categories = ['咖啡', '奶茶', '轻食', '套餐', '甜点', '饮品']

const products = [
  { _id: '1', name: '美式咖啡', price: 2200, category: '咖啡' },
  { _id: '2', name: '拿铁咖啡', price: 2800, category: '咖啡' },
  { _id: '3', name: '卡布奇诺', price: 2800, category: '咖啡' },
  { _id: '4', name: '焦糖玛奇朵', price: 3200, category: '咖啡' },
  { _id: '5', name: '冷萃咖啡', price: 2600, category: '咖啡' },
  { _id: '6', name: '燕麦拿铁', price: 3000, category: '咖啡' },
  { _id: '7', name: '桂花乌龙', price: 1800, category: '奶茶' },
  { _id: '8', name: '茉莉奶绿', price: 2000, category: '奶茶' },
  { _id: '9', name: '杨枝甘露', price: 2400, category: '奶茶' },
  { _id: '10', name: '三明治套餐', price: 3500, category: '轻食' },
  { _id: '11', name: '沙拉套餐', price: 3800, category: '轻食' },
  { _id: '12', name: '牛角包', price: 1200, category: '甜点' },
  { _id: '13', name: '提拉米苏', price: 2800, category: '甜点' },
]

const tables = [
  { id: 1, name: 'A1' },
  { id: 2, name: 'A2' },
  { id: 3, name: 'A3' },
  { id: 4, name: 'B1' },
  { id: 5, name: 'B2' },
]

const filteredProducts = computed(() => products.filter(p => p.category === activeCategory.value))

const orderNo = ref(`ORD${Date.now().toString().slice(-8)}`)

const cart = reactive({
  items: [],
  tableId: null,
  remark: '',
  discount: 0,
})

const cartComputed = computed(() => {
  const originalTotal = cart.items.reduce((s, i) => s + (i.price * i.quantity), 0) / 100
  const total = originalTotal - cart.discount
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  return {
    items: cart.items,
    tableId: cart.tableId,
    remark: cart.remark,
    discount: cart.discount,
    originalTotal: originalTotal.toFixed(2),
    total: Math.max(0, total).toFixed(2),
    itemCount,
  }
})

// 同步
Object.defineProperty(cart, 'originalTotal', { get: () => cartComputed.value.originalTotal })
Object.defineProperty(cart, 'total', { get: () => cartComputed.value.total })
Object.defineProperty(cart, 'itemCount', { get: () => cartComputed.value.itemCount })

const showPayDialog = ref(false)
const showSuccessDialog = ref(false)
const selectedPayMethod = ref('wechat')
const currentPayMethodName = ref('')

const payMethods = [
  { value: 'wechat', name: '微信支付', icon: '💚' },
  { value: 'alipay', name: '支付宝', icon: '💙' },
  { value: 'card', name: '储值卡', icon: '💳' },
  { value: 'cash', name: '现金', icon: '💵' },
]

function addToCart(product) {
  const existing = cart.items.find(i => i._id === product._id)
  if (existing) {
    existing.quantity++
  } else {
    cart.items.push({ ...product, quantity: 1 })
  }
}

function decreaseItem(idx) {
  if (cart.items[idx].quantity > 1) {
    cart.items[idx].quantity--
  }
}

function increaseItem(idx) {
  cart.items[idx].quantity++
}

function removeItem(idx) {
  cart.items.splice(idx, 1)
}

function clearCart() {
  cart.items = []
  cart.remark = ''
  cart.tableId = null
  cart.discount = 0
}

function submitOrder() {
  ElMessage.success('订单已提交')
}

function confirmPay() {
  currentPayMethodName.value = payMethods.find(m => m.value === selectedPayMethod.value)?.name || '微信支付'
  showPayDialog.value = false
  showSuccessDialog.value = true
}

function newOrder() {
  showSuccessDialog.value = false
  clearCart()
  orderNo.value = `ORD${Date.now().toString().slice(-8)}`
}

function printAndClose() {
  ElMessage.success('小票已打印')
  newOrder()
}
</script>

<style lang="scss" scoped>
.pos-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  overflow: hidden;
}

.pos-header {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.pos-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
}

.pos-logo { font-size: 24px; }

.pos-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

// 商品选择区
.pos-products {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--color-border);
  background: #ffffff;
}

.category-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  overflow-x: auto;
}

.cat-tab {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  transition: var(--transition);

  &:hover { background: var(--color-primary-light); color: var(--color-primary); }
  &.active { background: var(--color-primary); color: #ffffff; }
}

.product-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  align-content: start;
}

.product-btn {
  background: var(--color-bg);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px 12px;
  cursor: pointer;
  text-align: center;
  transition: var(--transition);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .p-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 6px;
  }

  .p-price {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-primary);
  }
}

// 购物车区
.pos-cart {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.cart-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.order-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
}

.order-label { font-size: 13px; color: var(--color-text-secondary); }
.order-no { font-size: 13px; font-weight: 700; color: var(--color-text); font-family: monospace; }

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  .empty-icon { font-size: 48px; opacity: 0.5; }
  .empty-text { font-size: 13px; color: var(--color-text-light); margin-top: 8px; }
}

.cart-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
  &:last-child { border-bottom: none; }
}

.item-info {
  .item-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
  .item-price { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-qty {
  min-width: 24px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.cart-remark {
  padding: 10px 20px;
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cart-summary {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;

  &.discount { }
  &.total {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-text);
    margin-top: 12px;
    padding-top: 12px;
    border-top: 2px solid var(--color-border);
    margin-bottom: 0;
  }
}

.total-amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-danger);
}

.cart-actions {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  .el-button { flex: 1; }
}

// 收款对话框
.pay-amount-display {
  text-align: center;
  padding: 20px 0;
  .pay-label { font-size: 13px; color: var(--color-text-secondary); }
  .pay-amount { font-size: 36px; font-weight: 700; color: var(--color-danger); margin-top: 8px; }
}

.pay-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.pay-method {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { border-color: var(--color-primary-light); }
  :deep(.el-radio__input.is-checked + .el-radio__label) { color: var(--color-text); }

  .method-icon { font-size: 20px; }
  .method-name { font-size: 14px; font-weight: 600; }
}

.pay-actions {
  display: flex;
  gap: 10px;
}

.success-content {
  text-align: center;
  padding: 20px 0;
  .success-icon { font-size: 56px; margin-bottom: 12px; }
  .success-amount { font-size: 32px; font-weight: 700; color: var(--color-success); }
  .success-method { font-size: 13px; color: var(--color-text-secondary); margin-top: 8px; }
}
</style>
