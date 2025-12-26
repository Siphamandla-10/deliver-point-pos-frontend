import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { productAPI, transactionAPI } from '../services/api';

// Color scheme - Dark theme with Purple accents (matching reference)
const COLORS = {
  primary: '#D946EF', // Bright purple/magenta
  primaryDark: '#A855F7',
  primaryLight: '#E879F9',
  background: '#1F1F1F', // Dark background
  cardBackground: '#2A2A2A', // Dark card background
  sidebarBg: '#1A1A1A', // Darker sidebar
  headerBg: '#2D2D2D',
  lightBg: '#333333',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9CA3AF',
  darkGray: '#6B7280',
  border: '#404040',
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
};

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: 'grid-outline' },
  { id: 'produce', name: 'Produce', icon: 'leaf-outline' },
  { id: 'dairy', name: 'Dairy', icon: 'water-outline' },
  { id: 'bakery', name: 'Bakery', icon: 'pizza-outline' },
  { id: 'meat', name: 'Meat & Seafood', icon: 'fish-outline' },
  { id: 'snacks', name: 'Snacks', icon: 'fast-food-outline' },
  { id: 'beverages', name: 'Beverages', icon: 'cafe-outline' },
];

const POSScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  // Products state
  const [allProducts, setAllProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [paginatedProducts, setPaginatedProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(0);

  // Cart state
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculation state
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount');
  const [total, setTotal] = useState(0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  // UI state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canScrollMore, setCanScrollMore] = useState(false);

  // Load all products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    let filtered = allProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (product) =>
          product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search
    if (searchQuery.trim().length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.barcode?.includes(searchQuery)
      );
    }

    setDisplayedProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, allProducts, selectedCategory]);

  // Update pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProducts(displayedProducts.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(displayedProducts.length / itemsPerPage));
  }, [displayedProducts, currentPage, itemsPerPage]);

  // Calculate totals
  useEffect(() => {
    calculateTotals();
  }, [cart, discount, discountType]);

  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    setChange(Math.max(0, paid - total));
  }, [amountPaid, total]);

  useEffect(() => {
    const hasMultipleItems = cart.length >= 3;
    setShowScrollIndicator(hasMultipleItems);
    setCanScrollMore(hasMultipleItems);
  }, [cart]);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setCanScrollMore(!isCloseToBottom && cart.length >= 3);
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productAPI.getAll({ isActive: true });
      if (response.data.success) {
        setAllProducts(response.data.data);
        setDisplayedProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const calculateTotals = () => {
    let sub = 0;
    let taxAmount = 0;

    cart.forEach((item) => {
      const itemSubtotal = item.price * item.quantity;
      sub += itemSubtotal;
      if (item.taxable) {
        taxAmount += (itemSubtotal * item.taxRate) / 100;
      }
    });

    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = (sub * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    const finalSubtotal = sub - discountAmount;
    const finalTotal = finalSubtotal + taxAmount;

    setSubtotal(sub);
    setTax(taxAmount);
    setTotal(Math.max(0, finalTotal));
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product === product._id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        Alert.alert('Stock Error', `Only ${product.stock} items available`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock < 1) {
        Alert.alert('Stock Error', 'Product out of stock');
        return;
      }
      setCart([
        ...cart,
        {
          product: product._id,
          productName: product.name,
          quantity: 1,
          price: product.price,
          taxable: product.taxable,
          taxRate: product.taxRate,
          imageUrl: product.imageUrl || null,
        },
      ]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.product === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
  };

  const clearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setCart([]);
          setDiscount(0);
          setComment('');
          setAmountPaid('');
        },
      },
    ]);
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    if (paid < total) {
      Alert.alert('Error', 'Amount paid is less than total');
      return;
    }

    setProcessing(true);
    try {
      const items = cart.map((item) => ({
        product: item.product,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        taxable: item.taxable,
        taxRate: item.taxRate,
        subtotal: item.price * item.quantity,
        tax: item.taxable
          ? (item.price * item.quantity * item.taxRate) / 100
          : 0,
        total:
          item.price * item.quantity +
          (item.taxable ? (item.price * item.quantity * item.taxRate) / 100 : 0),
      }));

      const transactionData = {
        items,
        subtotal,
        discount,
        discountType,
        tax,
        total,
        paymentMethod,
        amountPaid: paid,
        change,
        comment,
      };

      const response = await transactionAPI.create(transactionData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          `Transaction completed!\nChange: R${change.toFixed(2)}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setCart([]);
                setDiscount(0);
                setComment('');
                setAmountPaid('');
                setShowPaymentModal(false);
                loadProducts();
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Transaction failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => addToCart(item)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.productImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color={COLORS.gray} />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>R{item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category.id && styles.categoryButtonTextActive,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>nice</Text>
          </View>
          <Text style={styles.headerTitle}>Deliver Point Sales</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="cart-outline" size={24} color={COLORS.white} />
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Michael'}</Text>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || 'M')[0].toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content - Three Column Layout */}
      <View style={styles.mainContent}>
        {/* Left Sidebar - Categories */}
        <View style={styles.sidebar}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((category) => renderCategoryButton(category))}
          </ScrollView>
        </View>

        {/* Center - Products Grid */}
        <View style={styles.productsSection}>
          <View style={styles.productHeader}>
            <Text style={styles.productHeaderTitle}>
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name ||
                'Products'}
            </Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.gray}
              />
              <Ionicons name="search" size={20} color={COLORS.gray} />
            </View>
          </View>

          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : displayedProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cube-outline" size={60} color={COLORS.gray} />
              <Text style={styles.emptyProductsText}>No products found</Text>
            </View>
          ) : (
            <FlatList
              data={paginatedProducts}
              renderItem={renderProductCard}
              keyExtractor={(item) => item._id}
              numColumns={3}
              contentContainerStyle={styles.productsGrid}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Right Panel - Cart */}
        <View style={styles.cartPanel}>
          <Text style={styles.cartTitle}>Your Order</Text>

          <View style={styles.cartItemsWrapper}>
            <ScrollView
              style={styles.cartItemsContainer}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {cart.length === 0 ? (
                <View style={styles.emptyCart}>
                  <Text style={styles.emptyCartText}>No items in cart</Text>
                </View>
              ) : (
                cart.map((item) => (
                  <View key={item.product} style={styles.cartItem}>
                    <View style={styles.cartItemHeader}>
                      <Text style={styles.cartItemName}>{item.productName}</Text>
                      <TouchableOpacity onPress={() => removeFromCart(item.product)}>
                        <Ionicons name="close" size={20} color={COLORS.gray} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cartItemFooter}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(item.product, item.quantity - 1)
                          }
                          style={styles.qtyButton}
                        >
                          <Ionicons name="remove" size={16} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(item.product, item.quantity + 1)
                          }
                          style={styles.qtyButton}
                        >
                          <Ionicons name="add" size={16} color={COLORS.white} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cartItemPrice}>
                        R{(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Scroll Indicator - Positioned absolutely */}
            {showScrollIndicator && canScrollMore && (
              <View style={styles.scrollIndicator}>
                <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
                <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
              </View>
            )}
          </View>

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>R{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>R{tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total</Text>
              <Text style={styles.totalValueFinal}>R{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              cart.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.navButtonText}>New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('History')}
        >
          <Ionicons name="list" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navButtonText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Ionicons name="card" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navButtonText}>Payment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="settings" size={24} color={COLORS.textSecondary} />
          <Text style={styles.navButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Process Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryLabel}>Total Amount:</Text>
                <Text style={styles.paymentSummaryValue}>
                  R{total.toFixed(2)}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount Paid:</Text>
                <TextInput
                  style={styles.paymentInput}
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={COLORS.gray}
                />
              </View>

              {change > 0 && (
                <View style={styles.changeContainer}>
                  <Text style={styles.changeLabel}>Change:</Text>
                  <Text style={styles.changeValue}>R{change.toFixed(2)}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.processButton,
                  processing && styles.processButtonDisabled,
                ]}
                onPress={processPayment}
                disabled={processing}
                activeOpacity={0.85}
              >
                {processing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.processButtonText}>
                    Complete Transaction
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.headerBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  logo: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  headerIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Main Content - Three Columns
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  // Sidebar (Left)
  sidebar: {
    width: 200,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 10,
    marginVertical: 3,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  // Products Section (Center)
  productsSection: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.lightBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 14,
  },
  emptyProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyProductsText: {
    marginTop: 10,
    color: COLORS.gray,
    fontSize: 16,
  },
  productsGrid: {
    padding: 15,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: '31%',
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.white,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Cart Panel (Right)
  cartPanel: {
    width: 320,
    backgroundColor: COLORS.black,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  cartTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemsWrapper: {
    flex: 1,
    position: 'relative',
  },
  cartItemsContainer: {
    flex: 1,
    padding: 15,
    maxHeight: 350, // Fixed height to enable scrolling
  },
  emptyCart: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    minHeight: 200,
  },
  emptyCartText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  cartItem: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  cartItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 25,
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Semi-transparent background
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  totalsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  totalRowFinal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  totalValueFinal: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkoutButton: {
    margin: 20,
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  navButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.lightBg,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentSummaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentSummaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  paymentInput: {
    height: 55,
    backgroundColor: COLORS.lightBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    marginBottom: 20,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  changeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  processButton: {
    height: 55,
    backgroundColor: COLORS.primary, // Purple color
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processButtonDisabled: {
    opacity: 0.5,
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default POSScreen;