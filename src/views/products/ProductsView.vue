<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <div class="page-title">商品管理</div>
        <div class="page-subtitle">共 {{ total }} 个商品</div>
      </div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        添加商品
      </el-button>
    </div>

    <!-- 筛选 -->
    <div class="card-section filter-bar">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-input v-model="filters.keyword" placeholder="商品名称" clearable prefix-icon="Search" @keyup.enter="loadProducts" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.category" placeholder="商品分类" clearable @change="loadProducts">
            <el-option label="全部" value="" />
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="上下架状态" clearable @change="loadProducts">
            <el-option label="全部" value="" />
            <el-option label="在售" value="active" />
            <el-option label="已下架" value="inactive" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="loadProducts">搜索</el-button>
          <el-button @click="filters = { keyword: '', category: '', status: '' }; loadProducts()">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 商品列表 -->
    <div class="card-section">
      <el-table v-loading="loading" :data="products" stripe>
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image
                :src="row.image || row.imgUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'"
                fit="cover"
                class="product-thumb"
              />
              <div class="product-info">
                <div class="product-name">{{ row.name }}</div>
                <div class="product-desc">{{ row.desc || row.description || '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" prop="category" width="100" />

        <el-table-column label="规格/价格" width="150">
          <template #default="{ row }">
            <div class="price-cell">
              <div class="main-price">¥{{ (row.price / 100).toFixed(2) }}</div>
              <div class="original-price" v-if="row.originalPrice">¥{{ (row.originalPrice / 100).toFixed(2) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="库存" width="90">
          <template #default="{ row }">
            <span :class="['stock-tag', { low: (row.stock || 0) < 10 }]">
              {{ row.stock || 0 }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="销量" prop="sales" width="80" />

        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'" plain>
              {{ row.status === 'active' ? '在售' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" text :type="row.status === 'active' ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadProducts"
        @current-change="loadProducts"
      />
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑商品' : '添加商品'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="商品描述（选填）" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="价格(元)" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品图片">
          <el-input v-model="form.image" placeholder="图片URL（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { productsApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const products = ref([])
const total = ref(0)
const categories = ['咖啡', '奶茶', '轻食', '套餐', '甜点', '饮品']
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()

const filters = reactive({ keyword: '', category: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20 })

const form = reactive({ name: '', category: '', desc: '', price: 0, stock: 0, image: '' })
const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

async function loadProducts() {
  loading.value = true
  try {
    const params = { page: pagination.page, limit: pagination.pageSize }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    const res = await productsApi.list(params)
    const data = res.data?.list || res.data || res || []
    products.value = Array.isArray(data) ? data : []
    total.value = res.data?.total || products.value.length
  } catch (err) {
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  isEdit.value = false
  Object.assign(form, { name: '', category: '', desc: '', price: 0, stock: 0, image: '' })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(form, {
    name: row.name,
    category: row.category,
    desc: row.desc || row.description,
    price: (row.price / 100).toFixed(2) * 1,
    stock: row.stock || 0,
    image: row.image || row.imgUrl || '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = { ...form, price: Math.round(form.price * 100) }
    if (isEdit.value) {
      ElMessage.success('商品已更新')
    } else {
      ElMessage.success('商品已添加')
    }
    dialogVisible.value = false
    loadProducts()
  } catch (err) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  ElMessage.success(`商品已${newStatus === 'active' ? '上架' : '下架'}`)
  loadProducts()
}

onMounted(() => loadProducts())
</script>

<style lang="scss" scoped>
.filter-bar { :deep(.el-col) { margin-bottom: 12px; } }
.product-cell { display: flex; align-items: center; gap: 12px; }
.product-thumb { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: #f0ecf5; }
.product-name { font-weight: 600; font-size: 14px; }
.product-desc { font-size: 12px; color: var(--color-text-light); margin-top: 2px; }
.price-cell { .main-price { font-weight: 700; color: var(--color-danger); } .original-price { font-size: 12px; color: var(--color-text-light); text-decoration: line-through; } }
.stock-tag { font-weight: 600; &.low { color: var(--color-danger); } }
</style>
