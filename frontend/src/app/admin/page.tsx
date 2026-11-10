'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { fetchApi, getErrorMessage } from '../../lib/api';
import {
  Button,
  PageHeader,
  Card,
  Input,
  Badge,
  Modal,
  Toast,
  EmptyState,
  Skeleton,
} from '../../components/ui';
import {
  BarChart3,
  Coffee,
  Package,
  Ticket,
  MessageSquare,
  Users,
  Plus,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  Search,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Shield,
  Edit3,
  Trash2,
  FlaskConical,
  Upload,
} from 'lucide-react';
import {
  AdminOverview,
  RevenuePoint,
  TopProduct,
  IngredientRecord,
  SupplierRecord,
  ReviewRecord,
  PromotionRecord,
  ProductItem,
  AccountRecord,
  ImportReceiptRecord,
  RecipeRecord,
} from '@/types';
import {
  MOCK_ADMIN_OVERVIEW,
  MOCK_REVENUE_POINTS,
  MOCK_TOP_PRODUCTS,
  MOCK_INGREDIENTS,
  MOCK_SUPPLIERS,
  MOCK_REVIEWS,
  MOCK_PROMOTIONS,
  MOCK_ACCOUNTS,
} from '@/lib/mock/adminMock';
import { ALL_TOPPINGS } from '@/lib/toppings';
import { useRequireRole } from '@/hooks/useRequireRole';

type AdminTab = 'overview' | 'products' | 'inventory' | 'promotions' | 'reviews' | 'users';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const PRESET_PRODUCT_IMAGES = [
  { label: 'Cà phê Muối', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80' },
  { label: 'Trà Đào Cam Sả', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80' },
  { label: 'Đá Xay Matcha', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80' },
  { label: 'Bạc Xỉu 3 Tầng', url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&auto=format&fit=crop&q=80' },
  { label: 'Trà Sữa Trân Châu', url: 'https://images.unsplash.com/photo-1558857563-b371b26f743c?w=600&auto=format&fit=crop&q=80' },
];

export default function AdminDashboardPage() {
  const { ready } = useRequireRole(['ADMIN']);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  // Per-tab error state
  const [tabErrors, setTabErrors] = useState<Record<AdminTab, string | null>>({
    overview: null,
    products: null,
    inventory: null,
    promotions: null,
    reviews: null,
    users: null,
  });

  // Data states
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenueStats, setRevenueStats] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [importReceipts, setImportReceipts] = useState<ImportReceiptRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [accountsList, setAccountsList] = useState<AccountRecord[]>([]);

  // Filter states
  const [accountSearch, setAccountSearch] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('ALL');
  const [inventorySearch, setInventorySearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('ALL');

  // Modals state
  // 1. Warehouse Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [importQuantity, setImportQuantity] = useState<string>('5000');
  const [importUnitPrice, setImportUnitPrice] = useState<string>('10000');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [editingStockIngredient, setEditingStockIngredient] = useState<IngredientRecord | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<string>('10');
  const [savingStock, setSavingStock] = useState<boolean>(false);

  // 2. Add Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('COFFEE');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState(PRESET_PRODUCT_IMAGES[0].url);
  const [newPriceS, setNewPriceS] = useState('35000');
  const [newPriceM, setNewPriceM] = useState('42000');
  const [newPriceL, setNewPriceL] = useState('49000');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([
    'Trân châu đường đen',
    'Kem Cheese Macchiato',
  ]);
  const [productLoading, setProductLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProductRecipes, setNewProductRecipes] = useState<Array<{ ingredientId: string; quantity: string }>>([]);
  const [pendingRecipeIngId, setPendingRecipeIngId] = useState('');
  const [pendingRecipeQty, setPendingRecipeQty] = useState('25');

  // 3. Add Account Modal (Both Staff & Customer)
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [newAccountRole, setNewAccountRole] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('123456');
  const [newAccountFullName, setNewAccountFullName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [newAccountLoyaltyPoints, setNewAccountLoyaltyPoints] = useState('0');
  const [accountLoading, setAccountLoading] = useState(false);

  // 4. Edit Account Modal
  const [editAccountModalOpen, setEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoyaltyPoints, setEditLoyaltyPoints] = useState('0');
  const [editAccountLoading, setEditAccountLoading] = useState(false);

  // 5. Delete Account Confirm Modal
  const [deletingAccount, setDeletingAccount] = useState<AccountRecord | null>(null);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // 6. Recipe Modal
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<ProductItem | null>(null);
  const [productRecipes, setProductRecipes] = useState<RecipeRecord[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingRecipeQty, setEditingRecipeQty] = useState('');
  const [newRecipeVariantId, setNewRecipeVariantId] = useState('');
  const [newRecipeIngredientId, setNewRecipeIngredientId] = useState('');
  const [newRecipeQty, setNewRecipeQty] = useState('30');

  // 7. Promo Modal
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoValue, setNewPromoValue] = useState('15');
  const [newPromoType, setNewPromoType] = useState<'PERCENT' | 'FIXED'>('PERCENT');

  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        fetchApi('/admin/stats/overview'),
        fetchApi('/admin/stats/revenue'),
        fetchApi('/admin/stats/top-products'),
        fetchApi('/admin/ingredients'),
        fetchApi('/admin/suppliers'),
        fetchApi('/admin/reviews'),
        fetchApi('/admin/promotions'),
        fetchApi('/products?limit=100'),
        fetchApi('/admin/accounts'),
        fetchApi('/admin/import-receipts'),
      ]);

      const [
        resOverview,
        resRevenue,
        resTop,
        resIng,
        resSups,
        resRevs,
        resPromos,
        resProds,
        resAccs,
        resReceipts,
      ] = results;

      const newErrors: Record<AdminTab, string | null> = {
        overview: null,
        products: null,
        inventory: null,
        promotions: null,
        reviews: null,
        users: null,
      };

      // 1. Overview
      if (resOverview.status === 'fulfilled' && resOverview.value) {
        setOverview(resOverview.value as AdminOverview);
      } else if (USE_MOCK) {
        setOverview(MOCK_ADMIN_OVERVIEW);
      } else {
        setOverview(null);
        newErrors.overview = 'Không thể tải chỉ số tổng quan.';
      }

      // Revenue
      if (resRevenue.status === 'fulfilled' && resRevenue.value) {
        setRevenueStats(resRevenue.value as RevenuePoint[]);
      } else if (USE_MOCK) {
        setRevenueStats(MOCK_REVENUE_POINTS);
      } else {
        setRevenueStats([]);
      }

      // Top Products
      if (resTop.status === 'fulfilled' && resTop.value) {
        setTopProducts(resTop.value as TopProduct[]);
      } else if (USE_MOCK) {
        setTopProducts(MOCK_TOP_PRODUCTS);
      } else {
        setTopProducts([]);
      }

      // 2. Inventory (Ingredients + Suppliers + Receipts)
      if (resIng.status === 'fulfilled' && resIng.value) {
        const ings = resIng.value as IngredientRecord[];
        setIngredients(ings);
        if (ings.length > 0 && !selectedIngredientId) {
          setSelectedIngredientId(ings[0].id);
        }
      } else if (USE_MOCK) {
        setIngredients(MOCK_INGREDIENTS);
        if (MOCK_INGREDIENTS.length > 0 && !selectedIngredientId) {
          setSelectedIngredientId(MOCK_INGREDIENTS[0].id);
        }
      } else {
        setIngredients([]);
        newErrors.inventory = 'Không thể tải danh sách nguyên liệu và tồn kho.';
      }

      if (resSups.status === 'fulfilled' && resSups.value) {
        const sups = resSups.value as SupplierRecord[];
        setSuppliers(sups);
        if (sups.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(sups[0].id);
        }
      } else if (USE_MOCK) {
        setSuppliers(MOCK_SUPPLIERS);
        if (MOCK_SUPPLIERS.length > 0 && !selectedSupplierId) {
          setSelectedSupplierId(MOCK_SUPPLIERS[0].id);
        }
      } else {
        setSuppliers([]);
      }

      if (resReceipts.status === 'fulfilled' && resReceipts.value) {
        setImportReceipts(resReceipts.value as ImportReceiptRecord[]);
      }

      // 3. Reviews
      if (resRevs.status === 'fulfilled' && resRevs.value) {
        setReviews(resRevs.value as ReviewRecord[]);
      } else if (USE_MOCK) {
        setReviews(MOCK_REVIEWS);
      } else {
        setReviews([]);
        newErrors.reviews = 'Không thể tải danh sách đánh giá từ khách hàng.';
      }

      // 4. Promotions
      if (resPromos.status === 'fulfilled' && resPromos.value) {
        setPromotions(resPromos.value as PromotionRecord[]);
      } else if (USE_MOCK) {
        setPromotions(MOCK_PROMOTIONS);
      } else {
        setPromotions([]);
        newErrors.promotions = 'Không thể tải danh sách mã khuyến mãi.';
      }

      // 5. Products
      if (resProds.status === 'fulfilled' && resProds.value) {
        const pVal = resProds.value as { items?: ProductItem[] } | ProductItem[];
        const items = pVal && 'items' in pVal && Array.isArray(pVal.items)
          ? pVal.items
          : Array.isArray(pVal)
          ? pVal
          : [];
        setProductsList(items);
      } else {
        setProductsList([]);
        newErrors.products = 'Không thể tải danh mục món uống.';
      }

      // 6. Users / Accounts
      if (resAccs.status === 'fulfilled' && resAccs.value) {
        setAccountsList(resAccs.value as AccountRecord[]);
      } else if (USE_MOCK) {
        setAccountsList(MOCK_ACCOUNTS);
      } else {
        setAccountsList([]);
        newErrors.users = 'Không thể tải danh sách nhân sự và tài khoản.';
      }

      setTabErrors(newErrors);
    } catch (err: unknown) {
      console.error('Lỗi tải dữ liệu Admin:', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    loadData();
  }, [ready]);

  // Xử lý tạo phiếu nhập kho
  const handleCreateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    const qty = Number(importQuantity);
    const unitPrice = Number(importUnitPrice);

    if (!selectedSupplierId) {
      setImportError('Vui lòng chọn nhà cung cấp.');
      return;
    }
    if (!selectedIngredientId) {
      setImportError('Vui lòng chọn nguyên liệu nhập.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setImportError('Số lượng nhập phải lớn hơn 0.');
      return;
    }
    if (isNaN(unitPrice) || unitPrice <= 0) {
      setImportError('Đơn vị giá nhập phải lớn hơn 0.');
      return;
    }

    try {
      setImportLoading(true);
      await fetchApi('/admin/inventory/import', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: [
            {
              ingredientId: selectedIngredientId,
              quantity: qty,
              unitPrice: unitPrice,
            },
          ],
        }),
      });

      const ing = ingredients.find((i) => i.id === selectedIngredientId);
      setToastMsg({
        message: `Đã nhập thành công ${qty.toLocaleString('vi-VN')} ${ing?.unit || 'đơn vị'} ${ing?.name || 'nguyên liệu'} vào kho.`,
        type: 'success',
      });
      setImportModalOpen(false);
      setImportQuantity('5000');
      loadData();
    } catch (err: unknown) {
      setImportError(getErrorMessage(err));
    } finally {
      setImportLoading(false);
    }
  };

  const handleQuickImport = (ingId: string) => {
    setSelectedIngredientId(ingId);
    setImportModalOpen(true);
  };

  const handleSaveQuickStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockIngredient) return;
    try {
      setSavingStock(true);
      await fetchApi(`/admin/ingredients/${editingStockIngredient.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stockQuantity: Number(quickStockValue) }),
      });
      setIngredients((prev) =>
        prev.map((i) =>
          i.id === editingStockIngredient.id ? { ...i, stockQuantity: Number(quickStockValue) } : i
        )
      );
      setToastMsg({
        message: `Đã cập nhật tồn kho ${editingStockIngredient.name} thành ${Number(quickStockValue).toLocaleString('vi-VN')} ${editingStockIngredient.unit}`,
        type: 'success',
      });
      setEditingStockIngredient(null);
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setSavingStock(false);
    }
  };

  // Xử lý tạo sản phẩm mới
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setToastMsg({ message: 'Vui lòng nhập tên món đồ uống.', type: 'danger' });
      return;
    }

    const priceS = Number(newPriceS);
    const priceM = Number(newPriceM);
    const priceL = Number(newPriceL);

    if (isNaN(priceS) || priceS <= 0) {
      setToastMsg({ message: 'Vui lòng nhập giá Size S hợp lệ.', type: 'danger' });
      return;
    }

    try {
      setProductLoading(true);

      const variants = [
        { size: 'S', price: priceS, topping: 'Tiêu chuẩn' },
        { size: 'M', price: isNaN(priceM) || priceM <= 0 ? priceS + 6000 : priceM, topping: 'Tiêu chuẩn' },
        { size: 'L', price: isNaN(priceL) || priceL <= 0 ? priceS + 12000 : priceL, topping: 'Tiêu chuẩn' },
      ];

      const recipesToSend = newProductRecipes
        .filter((r) => r.ingredientId && Number(r.quantity) > 0)
        .map((r) => ({
          ingredientId: r.ingredientId,
          quantityRequired: Number(r.quantity),
          size: 'ALL',
        }));

      await fetchApi('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProductName.trim(),
          category: newProductCategory,
          imageUrl: newProductImage.trim(),
          description: newProductDesc.trim() || undefined,
          variants,
          recipes: recipesToSend.length > 0 ? recipesToSend : undefined,
        }),
      });

      setToastMsg({
        message: `Đã lưu món "$"{newProductName.trim()}" kèm công thức thành công vào thực đơn!`,
        type: 'success',
      });

      setProductModalOpen(false);
      setNewProductName('');
      setNewProductDesc('');
      setNewPriceS('35000');
      setNewPriceM('42000');
      setNewPriceL('49000');
      setNewProductRecipes([]);
      setPendingRecipeIngId('');
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setProductLoading(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToastMsg({ message: 'Ảnh vượt quá kích thước 5MB. Vui lòng chọn file nhẹ hơn.', type: 'danger' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewProductImage(reader.result);
        setToastMsg({ message: 'Đã tải ảnh lên từ máy tính thành công!', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPendingRecipe = () => {
    if (!pendingRecipeIngId) {
      setToastMsg({ message: 'Vui lòng chọn một nguyên liệu kho.', type: 'danger' });
      return;
    }
    const qty = Number(pendingRecipeQty);
    if (isNaN(qty) || qty <= 0) {
      setToastMsg({ message: 'Định lượng nguyên liệu phải lớn hơn 0.', type: 'danger' });
      return;
    }
    const existingIndex = newProductRecipes.findIndex((r) => r.ingredientId === pendingRecipeIngId);
    if (existingIndex >= 0) {
      const updated = [...newProductRecipes];
      updated[existingIndex].quantity = String(qty);
      setNewProductRecipes(updated);
    } else {
      setNewProductRecipes((prev) => [...prev, { ingredientId: pendingRecipeIngId, quantity: String(qty) }]);
    }
    setPendingRecipeQty('25');
  };

  const handleRemovePendingRecipe = (index: number) => {
    setNewProductRecipes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleToppingSelection = (topName: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topName) ? prev.filter((t) => t !== topName) : [...prev, topName]
    );
  };

  // =========================================================================
  // XỬ LÝ QUẢN TRỊ TÀI KHOẢN (THÊM / SỬA / XÓA KHÁCH HÀNG & BARISTA)
  // =========================================================================

  // 1. Thêm tài khoản mới (Chọn vai trò: STAFF hoặc CUSTOMER)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountUsername.trim() || !newAccountFullName.trim()) {
      setToastMsg({ message: 'Vui lòng điền đủ tên đăng nhập và họ tên.', type: 'danger' });
      return;
    }

    try {
      setAccountLoading(true);

      if (newAccountRole === 'STAFF') {
        await fetchApi('/admin/staff', {
          method: 'POST',
          body: JSON.stringify({
            username: newAccountUsername.trim(),
            password: newAccountPassword.trim() || '123456',
            fullName: newAccountFullName.trim(),
            email: newAccountEmail.trim() || `${newAccountUsername.trim()}@brewlite.vn`,
          }),
        });
        setToastMsg({
          message: `Đã tạo tài khoản Barista @${newAccountUsername.trim()} thành công!`,
          type: 'success',
        });
      } else {
        await fetchApi('/admin/customers', {
          method: 'POST',
          body: JSON.stringify({
            username: newAccountUsername.trim(),
            password: newAccountPassword.trim() || '123456',
            fullName: newAccountFullName.trim(),
            email: newAccountEmail.trim() || `${newAccountUsername.trim()}@gmail.com`,
            loyaltyPoints: Number(newAccountLoyaltyPoints) || 0,
          }),
        });
        setToastMsg({
          message: `Đã tạo tài khoản Khách hàng @${newAccountUsername.trim()} thành công!`,
          type: 'success',
        });
      }

      setAccountModalOpen(false);
      setNewAccountUsername('');
      setNewAccountFullName('');
      setNewAccountEmail('');
      setNewAccountLoyaltyPoints('0');
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setAccountLoading(false);
    }
  };

  // 2. Mở Modal sửa tài khoản
  const handleOpenEditAccount = (acc: AccountRecord) => {
    setEditingAccount(acc);
    setEditFullName(acc.fullName || acc.username);
    setEditEmail(acc.email || '');
    setEditPassword('');
    const pts = (acc as any).customer?.loyaltyPoints || 0;
    setEditLoyaltyPoints(String(pts));
    setEditAccountModalOpen(true);
  };

  // Lưu thông tin chỉnh sửa tài khoản
  const handleSaveEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setEditAccountLoading(true);
      await fetchApi(`/admin/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim(),
          password: editPassword.trim() ? editPassword.trim() : undefined,
          loyaltyPoints: editingAccount.role === 'CUSTOMER' ? Number(editLoyaltyPoints) : undefined,
        }),
      });

      setToastMsg({
        message: `Đã cập nhật thông tin tài khoản @${editingAccount.username} thành công!`,
        type: 'success',
      });
      setEditAccountModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setEditAccountLoading(false);
    }
  };

  // 3. Xóa tài khoản
  const handleConfirmDeleteAccount = async () => {
    if (!deletingAccount) return;

    try {
      setDeleteAccountLoading(true);
      await fetchApi(`/admin/accounts/${deletingAccount.id}`, {
        method: 'DELETE',
      });

      setToastMsg({
        message: `Đã xóa tài khoản @${deletingAccount.username} khỏi hệ thống thành công.`,
        type: 'success',
      });
      setDeletingAccount(null);
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  // 4. Khóa / Mở khóa tài khoản
  const handleToggleAccountStatus = async (accountId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'ACTIVE' ? `/admin/accounts/${accountId}/lock` : `/admin/accounts/${accountId}/unlock`;
      await fetchApi(endpoint, { method: 'PATCH' });
      setToastMsg({ message: 'Đã thay đổi trạng thái tài khoản thành công.', type: 'success' });
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  // =========================================================================
  // XỬ LÝ XEM & ĐIỀU CHỈNH CÔNG THỨC PHA CHẾ
  // =========================================================================
  const handleOpenRecipes = async (product: ProductItem) => {
    setSelectedProductForRecipe(product);
    setRecipeModalOpen(true);
    setRecipeLoading(true);
    try {
      const res = await fetchApi(`/admin/recipes`);
      const allRecs = (Array.isArray(res) ? res : (res as any)?.items || []) as RecipeRecord[];
      // Lọc các công thức thuộc các biến thể của sản phẩm này
      const filtered = allRecs.filter(
        (r) => r.variant?.productId === product.id || (product.variants && product.variants.some((v) => v.id === r.variantId))
      );
      setProductRecipes(filtered);

      // Điền sẵn default variant & ingredient
      if (product.variants && product.variants.length > 0) {
        setNewRecipeVariantId(product.variants[0].id);
      }
      if (ingredients.length > 0) {
        setNewRecipeIngredientId(ingredients[0].id);
      }
    } catch (err: unknown) {
      console.error('Lỗi tải công thức:', err);
    } finally {
      setRecipeLoading(false);
    }
  };

  // Cập nhật định lượng một nguyên liệu trong công thức
  const handleUpdateRecipeQuantity = async (recipeId: string) => {
    const qty = Number(editingRecipeQty);
    if (isNaN(qty) || qty <= 0) {
      setToastMsg({ message: 'Định lượng phải lớn hơn 0.', type: 'danger' });
      return;
    }

    try {
      await fetchApi(`/admin/recipes/${recipeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantityRequired: qty }),
      });

      setToastMsg({ message: 'Đã cập nhật định lượng công thức thành công!', type: 'success' });
      setEditingRecipeId(null);
      if (selectedProductForRecipe) {
        handleOpenRecipes(selectedProductForRecipe);
      }
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  // Thêm nguyên liệu mới vào công thức
  const handleAddRecipeIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeVariantId || !newRecipeIngredientId) {
      setToastMsg({ message: 'Vui lòng chọn size và nguyên liệu cần định lượng.', type: 'danger' });
      return;
    }

    const qty = Number(newRecipeQty);
    if (isNaN(qty) || qty <= 0) {
      setToastMsg({ message: 'Định lượng phải lớn hơn 0.', type: 'danger' });
      return;
    }

    try {
      await fetchApi('/admin/recipes', {
        method: 'POST',
        body: JSON.stringify({
          variantId: newRecipeVariantId,
          ingredientId: newRecipeIngredientId,
          quantityRequired: qty,
        }),
      });

      setToastMsg({ message: 'Đã thêm nguyên liệu vào công thức pha chế!', type: 'success' });
      if (selectedProductForRecipe) {
        handleOpenRecipes(selectedProductForRecipe);
      }
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  // Xóa nguyên liệu khỏi công thức
  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await fetchApi(`/admin/recipes/${recipeId}`, { method: 'DELETE' });
      setToastMsg({ message: 'Đã xóa nguyên liệu khỏi công thức.', type: 'success' });
      if (selectedProductForRecipe) {
        handleOpenRecipes(selectedProductForRecipe);
      }
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  // Toggle ẩn hiện đánh giá
  const handleToggleReview = async (reviewId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'VISIBLE' ? `/admin/reviews/${reviewId}/hide` : `/admin/reviews/${reviewId}/show`;
      await fetchApi(endpoint, { method: 'PATCH' });
      setToastMsg({ message: 'Đã cập nhật trạng thái hiển thị đánh giá.', type: 'success' });
      loadData();
    } catch (err: unknown) {
      setToastMsg({ message: getErrorMessage(err), type: 'danger' });
    }
  };

  if (!ready) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Tổng quan & Doanh thu', icon: BarChart3 },
    { id: 'products', label: 'Quản lý Sản phẩm & Công thức', icon: Coffee },
    { id: 'inventory', label: 'Kho & Nhập hàng', icon: Package },
    { id: 'promotions', label: 'Mã Khuyến mãi', icon: Ticket },
    { id: 'reviews', label: 'Đánh giá khách hàng', icon: MessageSquare },
    { id: 'users', label: 'Nhân sự & Khách hàng', icon: Users },
  ];

  const activeSelectedIng = ingredients.find((i) => i.id === selectedIngredientId);
  const currentStockNum = Number(activeSelectedIng?.stockQuantity || 0);
  const importQtyNum = Number(importQuantity) || 0;
  const estimatedImportTotal = importQtyNum * (Number(importUnitPrice) || 0);
  const afterImportStock = currentStockNum + importQtyNum;

  const maxDayRevenue = Math.max(
    ...revenueStats.map((st) => Number(st.amount || (st as any).revenue || 0)),
    100000
  );

  const filteredAccounts = accountsList.filter((acc) => {
    const matchesSearch =
      (acc.username || '').toLowerCase().includes(accountSearch.toLowerCase()) ||
      (acc.fullName || '').toLowerCase().includes(accountSearch.toLowerCase()) ||
      (acc.email || '').toLowerCase().includes(accountSearch.toLowerCase());
    const matchesRole = accountRoleFilter === 'ALL' || acc.role === accountRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredProducts = productsList.filter((p) => {
    if (productCategoryFilter === 'ALL') return true;
    return p.category === productCategoryFilter;
  });

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toastMsg && (
        <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />
      )}

      <PageHeader
        title="Bảng điều khiển quản trị"
        description="Quản lý thực đơn, công thức pha chế, định lượng kho nguyên liệu, doanh thu bán hàng và tài khoản."
        action={
          <Button variant="secondary" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Làm mới dữ liệu</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Nav (3 cols) */}
        <aside className="lg:col-span-3 border border-line rounded bg-surface p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded transition-colors text-left font-medium ${
                  isActive
                    ? 'bg-espresso text-espresso-text shadow-sm'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'inventory' && overview && overview.lowStockIngredients > 0 && (
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Content Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & REVENUE */}
              {activeTab === 'overview' && (
                tabErrors.overview ? (
                  <EmptyState
                    title="Không thể tải tổng quan"
                    description={tabErrors.overview}
                    actionLabel="Tải lại dữ liệu"
                    onAction={loadData}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Card className="p-4 space-y-1 bg-surface border-line">
                        <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider block">Doanh thu hôm nay</span>
                        <span className="font-display text-xl sm:text-2xl font-bold text-ink tabular-nums block">
                          {Number(overview?.totalRevenue || 0).toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Đã kết toán
                        </span>
                      </Card>

                      <Card className="p-4 space-y-1 bg-surface border-line">
                        <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider block">Tổng số đơn</span>
                        <span className="font-display text-xl sm:text-2xl font-bold text-ink tabular-nums block">
                          {overview?.totalOrders || 0}
                        </span>
                        <span className="text-[11px] text-ink-3">Toàn thời gian</span>
                      </Card>

                      <Card className="p-4 space-y-1 bg-surface border-line">
                        <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider block">Khách thành viên</span>
                        <span className="font-display text-xl sm:text-2xl font-bold text-accent tabular-nums block">
                          {overview?.activeCustomers ?? (overview as any)?.totalCustomers ?? 0}
                        </span>
                        <span className="text-[11px] text-ink-3">Đã đăng ký tài khoản</span>
                      </Card>

                      <Card className={`p-4 space-y-1 border ${overview && overview.lowStockIngredients > 0 ? 'bg-danger/5 border-danger/30' : 'bg-surface border-line'}`}>
                        <span className="text-[11px] font-medium text-ink-3 uppercase tracking-wider block">Nguyên liệu sắp hết</span>
                        <span className={`font-display text-xl sm:text-2xl font-bold tabular-nums block ${overview && overview.lowStockIngredients > 0 ? 'text-danger' : 'text-ink'}`}>
                          {overview?.lowStockIngredients ?? 0}
                        </span>
                        <span className={`text-[11px] flex items-center gap-1 ${overview && overview.lowStockIngredients > 0 ? 'text-danger font-medium' : 'text-ink-3'}`}>
                          {overview && overview.lowStockIngredients > 0 ? (
                            <>
                              <AlertTriangle className="w-3 h-3" /> Cần lập phiếu nhập
                            </>
                          ) : (
                            'Kho đang ổn định'
                          )}
                        </span>
                      </Card>
                    </div>

                    <Card className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <h3 className="font-display text-base font-semibold text-ink">Doanh thu 7 ngày gần nhất</h3>
                          <p className="text-xs text-ink-2 mt-0.5">Thống kê doanh số bán ra theo ngày từ các đơn hàng thành công.</p>
                        </div>
                      </div>

                      {revenueStats.length === 0 ? (
                        <div className="py-8 text-center text-xs text-ink-3">Chưa có giao dịch nào trong tuần này.</div>
                      ) : (
                        <div className="divide-y divide-line text-xs">
                          {revenueStats.map((st) => {
                            const dayRevenue = Number(st.amount ?? (st as any).revenue ?? 0);
                            const percent = Math.min(100, Math.round((dayRevenue / maxDayRevenue) * 100));

                            return (
                              <div key={st.date} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="sm:w-1/3">
                                  <span className="font-medium text-ink block">{st.date}</span>
                                  <span className="text-[11px] text-ink-3">
                                    {(st as any).orderCount ? `${(st as any).orderCount} đơn hàng hoàn tất` : 'Giao dịch quầy'}
                                  </span>
                                </div>

                                <div className="flex-1 max-w-xs hidden sm:block">
                                  <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-accent h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.max(percent, 8)}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="text-right sm:w-1/4">
                                  <span className="font-semibold text-ink tabular-nums text-sm block">
                                    {dayRevenue.toLocaleString('vi-VN')}đ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>

                    <Card className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <div>
                          <h3 className="font-display text-base font-semibold text-ink">Sản phẩm bán chạy nhất</h3>
                          <p className="text-xs text-ink-2 mt-0.5">Top 5 món đồ uống được khách hàng ưa chuộng và tiêu thụ nhiều nhất.</p>
                        </div>
                      </div>

                      {topProducts.length === 0 ? (
                        <div className="py-8 text-center text-xs text-ink-3">Chưa có dữ liệu sản phẩm bán ra.</div>
                      ) : (
                        <div className="divide-y divide-line text-xs">
                          {topProducts.map((p, idx) => {
                            const soldCount = p.totalSold ?? (p as any).quantity ?? 0;
                            return (
                              <div key={p.name} className="py-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                      idx === 0
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : idx === 1
                                        ? 'bg-slate-200 text-slate-700'
                                        : idx === 2
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-surface-2 text-ink-3'
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <span className="font-medium text-ink text-sm block">{p.name}</span>
                                    <span className="text-emerald-600 font-medium text-[11px] block">
                                      {soldCount} ly đã bán
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="font-semibold text-ink tabular-nums text-sm block">
                                    {Number(p.revenue).toLocaleString('vi-VN')}đ
                                  </span>
                                  <span className="text-[11px] text-ink-3 block">Doanh thu thu về</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </div>
                )
              )}

              {/* TAB 2: PRODUCTS & RECIPES */}
              {activeTab === 'products' && (
                tabErrors.products ? (
                  <EmptyState
                    title="Không thể tải sản phẩm"
                    description={tabErrors.products}
                    actionLabel="Tải lại sản phẩm"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">Thực đơn đồ uống & Công thức ({filteredProducts.length} món)</h3>
                        <p className="text-xs text-ink-2 mt-0.5">Quản lý món uống, cấu hình Size, Topping và định lượng công thức trừ kho.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={productCategoryFilter}
                          onChange={(e) => setProductCategoryFilter(e.target.value)}
                          className="h-8 px-2 text-xs bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
                        >
                          <option value="ALL">Tất cả danh mục</option>
                          <option value="COFFEE">Cà phê truyền thống</option>
                          <option value="TEA">Trà trái cây & Trà sữa</option>
                          <option value="FREEZE">Đá xay Freeze</option>
                        </select>
                        <Button variant="primary" size="sm" onClick={() => setProductModalOpen(true)} className="gap-1.5 shrink-0">
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span>Thêm món mới</span>
                        </Button>
                      </div>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {filteredProducts.map((p: ProductItem) => {
                        // Lọc lấy các size độc nhất (S, M, L) theo giá tiêu chuẩn, tránh lặp 12 biến thể topping
                        const uniqueSizes = ['S', 'M', 'L']
                          .map((size) =>
                            p.variants?.find((v) => v.size === size && (!v.topping || v.topping === 'Tiêu chuẩn')) ||
                            p.variants?.find((v) => v.size === size)
                          )
                          .filter(Boolean) as NonNullable<typeof p.variants>[number][];

                        const fallbackSizes =
                          uniqueSizes.length > 0
                            ? uniqueSizes
                            : Array.from(new Map((p.variants || []).map((v) => [v.size, v])).values()).slice(0, 3);

                        return (
                          <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative w-12 h-12 bg-surface-2 border border-line rounded overflow-hidden shrink-0">
                                <Image
                                  src={p.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'}
                                  alt={p.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-ink text-sm truncate block">{p.name}</span>
                                  <Badge variant="default" className="text-[10px] py-0 px-1.5 shrink-0">
                                    {p.category}
                                  </Badge>
                                </div>
                                <p className="text-ink-3 text-[11px] truncate max-w-md mt-0.5">
                                  {p.description || 'Chưa có mô tả chi tiết'}
                                </p>
                                {fallbackSizes.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {fallbackSizes.map((v) => (
                                      <span
                                        key={v.id || v.size}
                                        className="text-[10px] bg-surface-2 px-1.5 py-0.5 rounded text-ink-2 font-mono whitespace-nowrap"
                                      >
                                        Size {v.size}: {Number(v.price).toLocaleString('vi-VN')}đ
                                      </span>
                                    ))}
                                    {p.variants && p.variants.length > fallbackSizes.length && (
                                      <span className="text-[10px] text-ink-3 italic">
                                        (+{p.variants.length - fallbackSizes.length} topping đi kèm)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <div className="text-right whitespace-nowrap">
                                <span className="font-semibold text-ink tabular-nums text-sm block">
                                  Từ {Number(p.minPrice || (p.variants && p.variants[0]?.price) || 0).toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-[11px] text-emerald-600 font-medium">Đang mở bán</span>
                              </div>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenRecipes(p)}
                                className="gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/10 whitespace-nowrap shrink-0 h-8"
                              >
                                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                                <span>Công thức</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 3: INVENTORY & WAREHOUSE */}
              {activeTab === 'inventory' && (
                tabErrors.inventory ? (
                  <EmptyState
                    title="Không thể tải kho nguyên liệu"
                    description={tabErrors.inventory}
                    actionLabel="Tải lại kho"
                    onAction={loadData}
                  />
                ) : (
                  <div className="space-y-6">
                    <Card className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                        <div>
                          <h3 className="font-display text-base font-semibold text-ink">Bảng kiểm soát tồn kho nguyên liệu</h3>
                          <p className="text-xs text-ink-2 mt-0.5">Theo dõi số lượng tồn thực tế trong kho, cảnh báo cạn kiệt và nhập hàng.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-3" />
                            <input
                              type="text"
                              placeholder="Tìm nguyên liệu..."
                              value={inventorySearch}
                              onChange={(e) => setInventorySearch(e.target.value)}
                              className="h-8 pl-8 pr-2.5 text-xs bg-bg border border-line rounded text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none w-40 sm:w-48"
                            />
                          </div>
                          <Button variant="primary" size="sm" onClick={() => setImportModalOpen(true)} className="gap-1.5 shrink-0">
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Lập phiếu nhập kho</span>
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-line text-ink-3 font-medium bg-surface-2/50">
                              <th className="py-2.5 px-3">Tên nguyên liệu</th>
                              <th className="py-2.5 px-3">Đơn vị</th>
                              <th className="py-2.5 px-3 text-right">Tồn kho hiện tại</th>
                              <th className="py-2.5 px-3 text-center">Tình trạng tồn</th>
                              <th className="py-2.5 px-3 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {filteredIngredients.map((ing) => {
                              const stock = Number(ing.stockQuantity);
                              const isCritical = stock <= 2000;
                              const isLow = stock > 2000 && stock <= 5000;

                              return (
                                <tr key={ing.id} className="hover:bg-surface-2/30 transition-colors">
                                  <td className="py-3 px-3">
                                    <span className="font-semibold text-ink text-sm block">{ing.name}</span>
                                    <span className="text-[10px] text-ink-3 font-mono">ID: {ing.id.slice(0, 8)}</span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-mono text-ink-2 bg-surface-2 px-2 py-0.5 rounded text-[11px]">
                                      {ing.unit}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span
                                      className={`font-mono text-sm font-bold tabular-nums block ${
                                        isCritical ? 'text-danger' : isLow ? 'text-amber-600' : 'text-emerald-700'
                                      }`}
                                    >
                                      {stock.toLocaleString('vi-VN')} {ing.unit}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {isCritical ? (
                                      <Badge variant="danger" className="text-[11px] gap-1 inline-flex">
                                        <AlertTriangle className="w-3 h-3" /> Sắp hết hàng
                                      </Badge>
                                    ) : isLow ? (
                                      <Badge variant="warning" className="text-[11px] gap-1 inline-flex">
                                        Cần nhập thêm
                                      </Badge>
                                    ) : (
                                      <Badge variant="success" className="text-[11px] gap-1 inline-flex">
                                        <CheckCircle2 className="w-3 h-3" /> An toàn
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingStockIngredient(ing);
                                          setQuickStockValue(String(ing.stockQuantity));
                                        }}
                                        className="text-xs py-1 px-2 h-7 text-ink-2 hover:text-accent hover:bg-surface-2"
                                        title="Chỉnh sửa trực tiếp số lượng tồn kho (dùng cho test tranh mua hoặc hết hàng)"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                                        <span>Sửa tồn</span>
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleQuickImport(ing.id)}
                                        className="text-xs py-1 px-2.5 h-7"
                                      >
                                        Nhập thêm
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    {importReceipts.length > 0 && (
                      <Card className="space-y-3">
                        <h4 className="font-display text-sm font-semibold text-ink border-b border-line pb-2">
                          Lịch sử các phiếu nhập kho gần đây
                        </h4>
                        <div className="divide-y divide-line text-xs">
                          {importReceipts.slice(0, 5).map((rec) => (
                            <div key={rec.id} className="py-2.5 flex items-center justify-between">
                              <div>
                                <span className="font-medium text-ink block">
                                  Phiếu #{rec.id.slice(0, 8).toUpperCase()} · {rec.supplier?.name || 'Nhà cung cấp'}
                                </span>
                                <span className="text-[11px] text-ink-3">
                                  {new Date(rec.importDate).toLocaleDateString('vi-VN')} {new Date(rec.importDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  {rec.items && rec.items.length > 0 && (
                                    <> · {rec.items.map((i) => `${i.ingredient?.name || 'Nguyên liệu'} (+${i.quantity})`).join(', ')}</>
                                  )}
                                </span>
                              </div>
                              <span className="font-semibold text-ink tabular-nums">
                                {Number(rec.totalAmount).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )
              )}

              {/* TAB 4: PROMOTIONS */}
              {activeTab === 'promotions' && (
                tabErrors.promotions ? (
                  <EmptyState
                    title="Không thể tải khuyến mãi"
                    description={tabErrors.promotions}
                    actionLabel="Tải lại khuyến mãi"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">Mã khuyến mãi & Giảm giá</h3>
                        <p className="text-xs text-ink-2 mt-0.5">Quản lý các chiến dịch coupon ưu đãi dành cho khách hàng.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setPromoModalOpen(true)} className="gap-1">
                        <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Tạo mã mới</span>
                      </Button>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {promotions.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-accent text-sm">{p.code}</span>
                              <Badge variant={p.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
                                {p.status}
                              </Badge>
                            </div>
                            <span className="text-ink-2 text-xs block mt-0.5">{p.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-ink block text-sm">
                              {p.discountType === 'PERCENT' ? `-${p.discountValue}%` : `-${Number(p.discountValue).toLocaleString('vi-VN')}đ`}
                            </span>
                            <span className="text-ink-3 text-[11px] tabular-nums">
                              Đã dùng: {p.usedCount}/{p.quantity} lượt
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 5: REVIEWS */}
              {activeTab === 'reviews' && (
                tabErrors.reviews ? (
                  <EmptyState
                    title="Không thể tải đánh giá"
                    description={tabErrors.reviews}
                    actionLabel="Tải lại đánh giá"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="border-b border-line pb-3">
                      <h3 className="font-display text-base font-semibold text-ink">Kiểm duyệt đánh giá khách hàng</h3>
                      <p className="text-xs text-ink-2 mt-0.5">Kiểm soát phản hồi của khách hàng hiển thị trên ứng dụng.</p>
                    </div>

                    <div className="divide-y divide-line border-y border-line text-xs">
                      {reviews.map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{r.customer?.fullName || 'Khách hàng'}</span>
                              <span className="text-ink-3">đánh giá món {r.product?.name}</span>
                              <Badge variant={r.status === 'VISIBLE' ? 'success' : 'default'}>
                                {r.status === 'VISIBLE' ? 'Đang hiện' : 'Đang ẩn'}
                              </Badge>
                            </div>
                            <p className="text-ink-2">{r.content}</p>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleReview(r.id, r.status)}
                            className="gap-1.5 shrink-0"
                          >
                            {r.status === 'VISIBLE' ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                                <span>Ẩn đi</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
                                <span>Cho hiện</span>
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              )}

              {/* TAB 6: USERS & ACCOUNTS (FULL CRUD FOR STAFF & CUSTOMER) */}
              {activeTab === 'users' && (
                tabErrors.users ? (
                  <EmptyState
                    title="Không thể tải danh sách tài khoản"
                    description={tabErrors.users}
                    actionLabel="Tải lại danh sách"
                    onAction={loadData}
                  />
                ) : (
                  <Card className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                      <div>
                        <h3 className="font-display text-base font-semibold text-ink">
                          Quản lý Nhân sự & Khách hàng ({filteredAccounts.length})
                        </h3>
                        <p className="text-xs text-ink-2 mt-0.5">
                          Admin có toàn quyền Thêm, Sửa, Xóa và Khóa/Mở khóa tài khoản Barista và Khách hàng.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setNewAccountRole('STAFF');
                          setAccountModalOpen(true);
                        }}
                        className="gap-1.5 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Thêm tài khoản mới</span>
                      </Button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setAccountRoleFilter('ALL')}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                            accountRoleFilter === 'ALL'
                              ? 'bg-espresso text-espresso-text'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-2/80'
                          }`}
                        >
                          Tất cả ({accountsList.length})
                        </button>
                        <button
                          onClick={() => setAccountRoleFilter('STAFF')}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                            accountRoleFilter === 'STAFF'
                              ? 'bg-espresso text-espresso-text'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-2/80'
                          }`}
                        >
                          Barista ({accountsList.filter((a) => a.role === 'STAFF').length})
                        </button>
                        <button
                          onClick={() => setAccountRoleFilter('CUSTOMER')}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                            accountRoleFilter === 'CUSTOMER'
                              ? 'bg-espresso text-espresso-text'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-2/80'
                          }`}
                        >
                          Khách hàng ({accountsList.filter((a) => a.role === 'CUSTOMER').length})
                        </button>
                        <button
                          onClick={() => setAccountRoleFilter('ADMIN')}
                          className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                            accountRoleFilter === 'ADMIN'
                              ? 'bg-espresso text-espresso-text'
                              : 'bg-surface-2 text-ink-2 hover:bg-surface-2/80'
                          }`}
                        >
                          Admin ({accountsList.filter((a) => a.role === 'ADMIN').length})
                        </button>
                      </div>

                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-ink-3" />
                        <input
                          type="text"
                          placeholder="Tìm tài khoản, họ tên..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          className="w-full h-8 pl-8 pr-2.5 text-xs bg-bg border border-line rounded text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Account Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-line text-ink-3 font-medium bg-surface-2/50">
                            <th className="py-2.5 px-3">Họ và tên & Username</th>
                            <th className="py-2.5 px-3">Email liên hệ</th>
                            <th className="py-2.5 px-3 text-center">Vai trò</th>
                            <th className="py-2.5 px-3 text-center">Trạng thái</th>
                            <th className="py-2.5 px-3 text-right">Thao tác Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {filteredAccounts.map((acc) => {
                            const isStaff = acc.role === 'STAFF';
                            const isAdmin = acc.role === 'ADMIN';

                            return (
                              <tr key={acc.id} className="hover:bg-surface-2/30 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isAdmin
                                          ? 'bg-espresso text-espresso-text'
                                          : isStaff
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {(acc.fullName || acc.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-ink text-sm block">
                                        {acc.fullName || acc.username}
                                      </span>
                                      <span className="text-[11px] text-ink-3 font-mono">@{acc.username}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <span className="text-ink-2">{acc.email || '—'}</span>
                                  {acc.role === 'CUSTOMER' && (acc as any).customer?.loyaltyPoints !== undefined && (
                                    <span className="block text-[10px] text-accent font-medium">
                                      Điểm tích lũy: {(acc as any).customer.loyaltyPoints} điểm
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {isAdmin ? (
                                    <Badge variant="default" className="text-[10px] bg-stone-800 text-white">
                                      QUẢN TRỊ VIÊN
                                    </Badge>
                                  ) : isStaff ? (
                                    <Badge variant="warning" className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-300">
                                      BARISTA QUẦY
                                    </Badge>
                                  ) : (
                                    <Badge variant="success" className="text-[10px]">
                                      KHÁCH HÀNG
                                    </Badge>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'danger'}>
                                    {acc.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                                  </Badge>
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Nút Sửa tài khoản */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditAccount(acc)}
                                      className="text-xs h-7 px-2 text-ink-2 hover:text-accent hover:bg-surface-2"
                                      title="Chỉnh sửa thông tin"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline ml-1">Sửa</span>
                                    </Button>

                                    {/* Nút Khóa / Mở khóa */}
                                    {acc.role !== 'ADMIN' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggleAccountStatus(acc.id, acc.status)}
                                        className={`text-xs h-7 px-2 ${
                                          acc.status === 'ACTIVE'
                                            ? 'text-danger hover:bg-danger/10'
                                            : 'text-success hover:bg-success/10'
                                        }`}
                                        title={acc.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                                      >
                                        {acc.status === 'ACTIVE' ? (
                                          <Lock className="w-3.5 h-3.5" />
                                        ) : (
                                          <Unlock className="w-3.5 h-3.5" />
                                        )}
                                      </Button>
                                    )}

                                    {/* Nút Xóa tài khoản */}
                                    {acc.role !== 'ADMIN' && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeletingAccount(acc)}
                                        className="text-xs h-7 px-2 text-danger hover:bg-danger/10"
                                        title="Xóa vĩnh viễn tài khoản"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL 1: Lập Phiếu Nhập Kho Nguyên Liệu */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportError(null);
        }}
        title="Lập phiếu nhập kho nguyên liệu"
        description="Chọn nhà cung cấp, nguyên liệu và số lượng nhập thực tế để tự động cộng dồn tồn kho."
      >
        <form onSubmit={handleCreateImport} className="space-y-3.5 text-xs text-left">
          {importError && (
            <div className="p-2.5 bg-danger-soft border border-danger/30 rounded text-danger text-xs">
              {importError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Nhà cung cấp đối tác</label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Nguyên liệu nhập kho</label>
            <select
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} (Tồn hiện tại: {Number(ing.stockQuantity).toLocaleString('vi-VN')} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          {activeSelectedIng && (
            <div className="p-3 bg-surface-2/60 border border-line rounded space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-2">Tồn kho hiện tại:</span>
                <span className="font-bold text-ink font-mono">
                  {currentStockNum.toLocaleString('vi-VN')} {activeSelectedIng.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>Dự tính sau khi nhập:</span>
                <span className="font-bold font-mono">
                  {afterImportStock.toLocaleString('vi-VN')} {activeSelectedIng.unit} (+{importQtyNum.toLocaleString('vi-VN')})
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Số lượng nhập (${activeSelectedIng?.unit || 'đơn vị'})`}
              type="number"
              min="1"
              required
              value={importQuantity}
              onChange={(e) => setImportQuantity(e.target.value)}
              placeholder="VD: 5000"
            />
            <Input
              label="Đơn vị giá nhập (VNĐ)"
              type="number"
              min="1"
              required
              value={importUnitPrice}
              onChange={(e) => setImportUnitPrice(e.target.value)}
              placeholder="10000"
            />
          </div>

          <div className="p-3 bg-surface border border-line rounded flex items-center justify-between text-xs">
            <span className="text-ink-2 font-medium">Tổng giá trị phiếu nhập:</span>
            <span className="font-display font-bold text-ink tabular-nums text-base text-accent">
              {estimatedImportTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                setImportModalOpen(false);
                setImportError(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={importLoading}
              disabled={estimatedImportTotal <= 0}
            >
              Xác nhận nhập kho
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Thêm Món Uống Mới (Image + Sizes + Toppings) */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Thêm món đồ uống mới"
        description="Định cấu hình tên món, ảnh minh họa, định giá size (S/M/L) và các topping đi kèm."
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          <Input
            label="Tên món đồ uống"
            required
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="VD: Cà phê Muối Cố Đô"
          />

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Danh mục đồ uống</label>
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
            >
              <option value="COFFEE">Cà phê truyền thống & Ý (COFFEE)</option>
              <option value="TEA">Trà trái cây & Trà sữa (TEA)</option>
              <option value="FREEZE">Đá xay Freeze & Sinh tố (FREEZE)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-ink block">Mô tả món uống</label>
            <textarea
              rows={2}
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              placeholder="VD: Cà phê Robusta Đắk Lắk đậm đà hòa quyện cùng lớp kem muối béo mặn..."
              className="w-full p-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none text-xs"
            />
          </div>

          <div className="space-y-2 p-3 bg-surface-2/40 border border-line rounded">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink block">Hình ảnh món đồ uống</label>
              <span className="text-[11px] text-ink-3">Tải ảnh từ máy tính hoặc dán link URL</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Click vào xem trước ảnh để mở chọn file từ máy */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded border-2 border-dashed border-accent/40 hover:border-accent bg-surface overflow-hidden shrink-0 cursor-pointer group transition-all"
                title="Nhấp vào đây để chọn ảnh từ máy tính"
              >
                <Image
                  src={newProductImage || PRESET_PRODUCT_IMAGES[0].url}
                  alt="Xem trước ảnh món"
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-cover group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] transition-opacity font-medium">
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Đổi ảnh</span>
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2.5 bg-surface hover:bg-surface-2 border border-line hover:border-accent text-accent font-semibold text-[11px] rounded inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính</span>
                  </button>
                  <span className="text-[10px] text-ink-3">hoặc dán đường link:</span>
                </div>

                <input
                  type="text"
                  required
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  placeholder="Dán link ảnh https://... hoặc tải từ máy"
                  className="w-full h-8 px-2.5 bg-bg border border-line rounded text-ink text-xs focus:border-accent focus:outline-none"
                />

                <div className="flex flex-wrap gap-1">
                  {PRESET_PRODUCT_IMAGES.map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => setNewProductImage(preset.url)}
                      className="text-[10px] px-2 py-0.5 bg-surface border border-line rounded text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-ink block">Bảng giá theo kích cỡ (Size Pricing)</label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="Size S (VNĐ)"
                type="number"
                required
                value={newPriceS}
                onChange={(e) => setNewPriceS(e.target.value)}
                placeholder="35000"
              />
              <Input
                label="Size M (VNĐ)"
                type="number"
                required
                value={newPriceM}
                onChange={(e) => setNewPriceM(e.target.value)}
                placeholder="42000"
              />
              <Input
                label="Size L (VNĐ)"
                type="number"
                required
                value={newPriceL}
                onChange={(e) => setNewPriceL(e.target.value)}
                placeholder="49000"
              />
            </div>
          </div>

          {/* CÔNG THỨC PHA CHẾ BAN ĐẦU */}
          <div className="space-y-2 p-3 bg-surface-2/40 border border-line rounded">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-accent" />
                <span>Công thức pha chế (Định lượng nguyên liệu)</span>
              </label>
              <span className="text-[11px] text-ink-3">Đã thêm: {newProductRecipes.length} nguyên liệu</span>
            </div>
            <p className="text-[11px] text-ink-3">
              Nhập định lượng chuẩn cho Size S. Hệ thống sẽ tự động scale tỷ lệ tương ứng theo Size M (+30%) và Size L (+60%).
            </p>

            <div className="flex items-end gap-2 pt-1">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] text-ink-2 block">Chọn nguyên liệu kho</label>
                <select
                  value={pendingRecipeIngId}
                  onChange={(e) => setPendingRecipeIngId(e.target.value)}
                  className="w-full h-8 px-2 bg-bg border border-line rounded text-xs text-ink focus:border-accent focus:outline-none"
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24 space-y-1">
                <label className="text-[10px] text-ink-2 block">Định lượng (S)</label>
                <input
                  type="number"
                  min="1"
                  value={pendingRecipeQty}
                  onChange={(e) => setPendingRecipeQty(e.target.value)}
                  placeholder="25"
                  className="w-full h-8 px-2 bg-bg border border-line rounded text-xs text-ink focus:border-accent focus:outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleAddPendingRecipe}
                className="h-8 px-3 bg-accent hover:bg-accent-hover text-on-accent font-semibold text-xs rounded transition-colors shrink-0"
              >
                + Thêm
              </button>
            </div>

            {newProductRecipes.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-line/60">
                {newProductRecipes.map((r, idx) => {
                  const ing = ingredients.find((i) => i.id === r.ingredientId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 px-2.5 bg-surface border border-line rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="font-medium text-ink">{ing?.name || 'Nguyên liệu'}</span>
                        <span className="font-mono text-accent font-semibold">
                          {r.quantity} {ing?.unit || ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePendingRecipe(idx)}
                        className="text-ink-3 hover:text-danger text-[11px] p-0.5 rounded transition-colors"
                        title="Xóa nguyên liệu này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-ink-3 italic py-1 text-center bg-surface/50 rounded border border-dashed border-line">
                Chưa thêm công thức nguyên liệu (có thể cấu hình sau qua nút "Công thức").
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-ink block">Topping được phép gọi kèm</label>
              <span className="text-[11px] text-ink-3">Đã chọn: {selectedToppings.length} loại</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-surface-2/30 border border-line rounded max-h-36 overflow-y-auto">
              {ALL_TOPPINGS.map((top) => {
                const checked = selectedToppings.includes(top.name);
                return (
                  <label
                    key={top.id}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border transition-colors ${
                      checked
                        ? 'bg-surface border-accent/40 text-ink'
                        : 'border-transparent text-ink-2 hover:bg-surface-2'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleToppingSelection(top.name)}
                      className="accent-accent"
                    />
                    <span className="truncate">{top.name}</span>
                    <span className="text-[10px] text-ink-3 ml-auto font-mono">
                      +{top.price.toLocaleString('vi-VN')}đ
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setProductModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={productLoading}>
              Lưu món mới
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: THÊM TÀI KHOẢN MỚI (BARISTA HOẶC KHÁCH HÀNG) */}
      <Modal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        title="Thêm tài khoản mới"
        description="Khởi tạo tài khoản nhân viên pha chế Barista hoặc khách hàng thành viên vào hệ thống."
      >
        <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs text-left">
          <div className="space-y-1">
            <label className="font-semibold text-ink block">Loại tài khoản (Phân quyền)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewAccountRole('STAFF')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  newAccountRole === 'STAFF'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-800'
                    : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Nhân viên Barista</span>
              </button>

              <button
                type="button"
                onClick={() => setNewAccountRole('CUSTOMER')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  newAccountRole === 'CUSTOMER'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-800'
                    : 'bg-surface border-line text-ink-2 hover:bg-surface-2'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Khách hàng Thành viên</span>
              </button>
            </div>
          </div>

          <Input
            label="Tên đăng nhập (Username)"
            required
            value={newAccountUsername}
            onChange={(e) => setNewAccountUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder={newAccountRole === 'STAFF' ? 'VD: barista_thao' : 'VD: khachhang_ngoc'}
          />

          <Input
            label="Mật khẩu khởi tạo"
            type="password"
            required
            value={newAccountPassword}
            onChange={(e) => setNewAccountPassword(e.target.value)}
            placeholder="Mặc định: 123456"
          />

          <Input
            label="Họ và tên hiển thị"
            required
            value={newAccountFullName}
            onChange={(e) => setNewAccountFullName(e.target.value)}
            placeholder={newAccountRole === 'STAFF' ? 'VD: Lê Thị Thảo (Barista Ca Sáng)' : 'VD: Nguyễn Bảo Ngọc'}
          />

          <Input
            label="Email liên hệ"
            type="email"
            value={newAccountEmail}
            onChange={(e) => setNewAccountEmail(e.target.value)}
            placeholder={newAccountRole === 'STAFF' ? 'barista.thao@brewlite.vn' : 'ngoc.customer@gmail.com'}
          />

          {newAccountRole === 'CUSTOMER' && (
            <Input
              label="Điểm tích lũy khởi tạo"
              type="number"
              min="0"
              value={newAccountLoyaltyPoints}
              onChange={(e) => setNewAccountLoyaltyPoints(e.target.value)}
              placeholder="0"
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setAccountModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={accountLoading}>
              Khởi tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: SỬA TÀI KHOẢN (EDIT ACCOUNT) */}
      <Modal
        isOpen={editAccountModalOpen}
        onClose={() => setEditAccountModalOpen(false)}
        title={`Chỉnh sửa tài khoản @${editingAccount?.username}`}
        description="Cập nhật thông tin định danh, email, điểm thưởng hoặc đặt lại mật khẩu cho tài khoản."
      >
        <form onSubmit={handleSaveEditAccount} className="space-y-3.5 text-xs text-left">
          <Input
            label="Họ và tên"
            required
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
          />

          <Input
            label="Email liên hệ"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
          />

          <Input
            label="Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)"
            type="password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            placeholder="Nhập tối thiểu 6 ký tự..."
          />

          {editingAccount?.role === 'CUSTOMER' && (
            <Input
              label="Điểm tích lũy thành viên"
              type="number"
              min="0"
              value={editLoyaltyPoints}
              onChange={(e) => setEditLoyaltyPoints(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditAccountModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={editAccountLoading}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: XÁC NHẬN XÓA TÀI KHOẢN (DELETE ACCOUNT CONFIRM) */}
      <Modal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title="Xác nhận xóa tài khoản"
        description={`Bạn có chắc chắn muốn xóa tài khoản @${deletingAccount?.username} (${deletingAccount?.fullName}) không?`}
      >
        <div className="space-y-4 text-xs text-left">
          <div className="p-3 bg-danger-soft border border-danger/30 rounded text-danger space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Cảnh báo quan trọng:
            </div>
            <p>Hành động này sẽ xóa hoàn toàn hồ sơ và thông tin liên kết của tài khoản. Dữ liệu sau khi xóa không thể phục hồi.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setDeletingAccount(null)}>
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              loading={deleteAccountLoading}
              onClick={handleConfirmDeleteAccount}
            >
              Xác nhận xóa vĩnh viễn
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 6: CÔNG THỨC PHA CHẾ & ĐỊNH LƯỢNG KHO */}
      <Modal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        title={`Công thức pha chế & Định lượng kho: ${selectedProductForRecipe?.name}`}
        description="Định lượng nguyên liệu thực tế cho từng kích cỡ. Khi khách đặt món, hệ thống sẽ tự động trừ kho nguyên liệu theo công thức này."
      >
        <div className="space-y-4 text-xs text-left max-h-[75vh] overflow-y-auto pr-1">
          {recipeLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              {/* Danh sách công thức hiện có */}
              <div className="space-y-2">
                <span className="font-semibold text-ink block">Định lượng nguyên liệu theo từng Size:</span>

                {productRecipes.length === 0 ? (
                  <div className="p-4 bg-surface-2 rounded text-center text-ink-3">
                    Món này chưa có công thức định lượng chi tiết. Bạn có thể thêm nguyên liệu bên dưới!
                  </div>
                ) : (
                  <div className="divide-y divide-line border border-line rounded bg-surface">
                    {productRecipes.map((r) => (
                      <div key={r.id} className="p-2.5 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold bg-espresso text-espresso-text px-1.5 py-0.5 rounded">
                              Size {r.variant?.size || 'Tiêu chuẩn'}
                            </span>
                            <span className="font-medium text-ink text-sm">{r.ingredient?.name}</span>
                          </div>
                          <span className="text-[11px] text-ink-3 mt-0.5 block">
                            Tồn kho còn: {Number(r.ingredient?.stockQuantity || 0).toLocaleString('vi-VN')} {r.ingredient?.unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingRecipeId === r.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                value={editingRecipeQty}
                                onChange={(e) => setEditingRecipeQty(e.target.value)}
                                className="w-16 h-7 px-1.5 text-xs bg-bg border border-accent rounded font-mono font-bold"
                              />
                              <span className="text-ink-2">{r.ingredient?.unit}</span>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateRecipeQuantity(r.id)}
                                className="h-7 px-2 text-[11px]"
                              >
                                Lưu
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingRecipeId(null)}
                                className="h-7 px-1.5 text-[11px]"
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-accent text-sm">
                                {Number(r.quantityRequired).toLocaleString('vi-VN')} {r.ingredient?.unit}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingRecipeId(r.id);
                                  setEditingRecipeQty(String(r.quantityRequired));
                                }}
                                className="h-7 px-1.5 text-ink-3 hover:text-ink"
                                title="Sửa định lượng"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRecipe(r.id)}
                                className="h-7 px-1.5 text-danger hover:bg-danger/10"
                                title="Xóa khỏi công thức"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form thêm nguyên liệu vào công thức */}
              <form onSubmit={handleAddRecipeIngredient} className="p-3 bg-surface-2/40 border border-line rounded space-y-3">
                <span className="font-semibold text-ink block">+ Thêm nguyên liệu định lượng vào món</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-2 block">Chọn Size món</label>
                    <select
                      value={newRecipeVariantId}
                      onChange={(e) => setNewRecipeVariantId(e.target.value)}
                      className="w-full h-8 px-2 bg-bg border border-line rounded text-ink text-xs focus:border-accent focus:outline-none"
                    >
                      {selectedProductForRecipe?.variants?.map((v) => (
                        <option key={v.id} value={v.id}>Size {v.size} ({Number(v.price).toLocaleString('vi-VN')}đ)</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-2 block">Chọn Nguyên liệu kho</label>
                    <select
                      value={newRecipeIngredientId}
                      onChange={(e) => setNewRecipeIngredientId(e.target.value)}
                      className="w-full h-8 px-2 bg-bg border border-line rounded text-ink text-xs focus:border-accent focus:outline-none"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ink-2 block">Định lượng cần (ml / g)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        required
                        value={newRecipeQty}
                        onChange={(e) => setNewRecipeQty(e.target.value)}
                        placeholder="VD: 40"
                        className="w-full h-8 px-2 bg-bg border border-line rounded text-ink text-xs focus:border-accent focus:outline-none"
                      />
                      <Button variant="primary" size="sm" type="submit" className="h-8 px-3 shrink-0">
                        Thêm
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setRecipeModalOpen(false)}>
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 7: TẠO MÃ KHUYẾN MÃI MỚI */}
      <Modal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        title="Tạo mã khuyến mãi mới"
        description="Định cấu hình mã giảm giá theo phần trăm hoặc số tiền cố định."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await fetchApi('/admin/promotions', {
                method: 'POST',
                body: JSON.stringify({
                  code: newPromoCode.trim().toUpperCase(),
                  name: newPromoName.trim(),
                  discountType: newPromoType,
                  discountValue: Number(newPromoValue),
                  quantity: 100,
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                }),
              });
              setToastMsg({ message: `Đã phát hành mã "${newPromoCode.toUpperCase()}".`, type: 'success' });
              setPromoModalOpen(false);
              loadData();
            } catch (err: unknown) {
              setToastMsg({ message: getErrorMessage(err), type: 'danger' });
            }
          }}
          className="space-y-3.5 text-xs text-left"
        >
          <Input
            label="Mã code (Viết hoa)"
            required
            value={newPromoCode}
            onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
            placeholder="VD: SUMMERSALE"
          />
          <Input
            label="Mô tả chương trình"
            required
            value={newPromoName}
            onChange={(e) => setNewPromoName(e.target.value)}
            placeholder="VD: Giảm nhiệt mùa hè"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-ink block">Loại giảm giá</label>
              <select
                value={newPromoType}
                onChange={(e) => setNewPromoType(e.target.value as 'PERCENT' | 'FIXED')}
                className="w-full h-9 px-2.5 bg-bg border border-line rounded text-ink focus:border-accent focus:outline-none"
              >
                <option value="PERCENT">Theo phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <Input
              label={newPromoType === 'PERCENT' ? 'Tỉ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
              type="number"
              required
              value={newPromoValue}
              onChange={(e) => setNewPromoValue(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="secondary" size="sm" type="button" onClick={() => setPromoModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo mã
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Chỉnh sửa trực tiếp tồn kho (dùng cho test tranh mua hoặc hết hàng) */}
      <Modal
        isOpen={Boolean(editingStockIngredient)}
        onClose={() => setEditingStockIngredient(null)}
        title="Chỉnh sửa tồn kho nguyên liệu trực tiếp"
        description={`Cập nhật số lượng tồn thực tế cho: ${editingStockIngredient?.name || 'Nguyên liệu'}`}
      >
        <form onSubmit={handleSaveQuickStock} className="space-y-4 text-xs text-left">
          <div className="space-y-1.5">
            <label className="font-semibold text-ink block">
              Số lượng tồn kho mới ({editingStockIngredient?.unit})
            </label>
            <input
              type="number"
              min="0"
              required
              value={quickStockValue}
              onChange={(e) => setQuickStockValue(e.target.value)}
              className="w-full h-9 px-3 bg-bg border border-line rounded text-ink text-sm font-mono focus:border-accent focus:outline-none"
              placeholder="VD: 10 để test tranh mua hoặc 0 để test hết hàng"
            />
            <span className="text-[11px] text-ink-3 block">
              💡 Mẹo kiểm thử: Đặt = 10 để test 2 khách cùng tranh mua 1 ly cuối, hoặc đặt = 0 để kiểm tra hiển thị "Tạm hết hàng".
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setEditingStockIngredient(null)}
            >
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={savingStock}>
              Lưu số lượng
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
