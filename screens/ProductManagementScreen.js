import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../services/AuthContext';
import { productAPI, uploadAPI } from '../services/api';

const COLORS = {
  primary: '#E935F1',
  primaryDark: '#A21CAF',
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  lightBg: '#F9FAFB',
  success: '#10B981',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
  darkGray: '#374151',
  border: '#E5E7EB',
};

const ProductManagementScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const editingProduct = route?.params?.product;

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Other');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [taxable, setTaxable] = useState(true);
  const [taxRate, setTaxRate] = useState('15');

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Other');

  const categories = ['Beverages', 'Food', 'Snacks', 'Dairy', 'Bakery', 'Household', 'Other'];

  useEffect(() => {
    requestPermissions();
    if (editingProduct) {
      loadProductData();
    }
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  const loadProductData = () => {
    setName(editingProduct.name);
    setSku(editingProduct.sku);
    setBarcode(editingProduct.barcode || '');
    setCategory(editingProduct.category);
    setSelectedCategory(editingProduct.category);
    setPrice(editingProduct.price.toString());
    setCost(editingProduct.cost.toString());
    setStock(editingProduct.stock.toString());
    setDescription(editingProduct.description || '');
    setImageUrl(editingProduct.imageUrl);
    setLowStockThreshold(editingProduct.lowStockThreshold.toString());
    setTaxable(editingProduct.taxable);
    setTaxRate(editingProduct.taxRate.toString());
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);

      // Create form data
      const formData = new FormData();
      
      // Get file extension
      const uriParts = imageAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('image', {
        uri: Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri,
        name: `product-${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });

      const response = await uploadAPI.uploadProductImage(formData);

      if (response.data.success) {
        setImageUrl(response.data.data.imageUrl);
        Alert.alert('Success', 'Image uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('Error', 'Please enter SKU');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter valid price');
      return;
    }
    if (!cost || parseFloat(cost) <= 0) {
      Alert.alert('Error', 'Please enter valid cost');
      return;
    }
    if (!stock || parseInt(stock) < 0) {
      Alert.alert('Error', 'Please enter valid stock quantity');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim() || undefined,
        category: selectedCategory,
        price: parseFloat(price),
        cost: parseFloat(cost),
        stock: parseInt(stock),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        lowStockThreshold: parseInt(lowStockThreshold),
        taxable,
        taxRate: parseFloat(taxRate),
        isActive: true,
      };

      let response;
      if (editingProduct) {
        response = await productAPI.update(editingProduct._id, productData);
      } else {
        response = await productAPI.create(productData);
      }

      if (response.data.success) {
        Alert.alert(
          'Success',
          `Product ${editingProduct ? 'updated' : 'created'} successfully`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editingProduct ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <TouchableOpacity 
            style={styles.imageUploadContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : imageUrl ? (
              <>
                <Image source={{ uri: imageUrl }} style={styles.uploadedImage} />
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera" size={24} color={COLORS.white} />
                  <Text style={styles.changeImageText}>Change Image</Text>
                </View>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={60} color={COLORS.gray} />
                <Text style={styles.uploadText}>Tap to upload image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter product name"
              placeholderTextColor={COLORS.gray}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>SKU *</Text>
              <TextInput
                style={styles.input}
                placeholder="SKU"
                placeholderTextColor={COLORS.gray}
                value={sku}
                onChangeText={setSku}
                autoCapitalize="characters"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Barcode</Text>
              <TextInput
                style={styles.input}
                placeholder="Barcode"
                placeholderTextColor={COLORS.gray}
                value={barcode}
                onChangeText={setBarcode}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Product description"
              placeholderTextColor={COLORS.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pricing & Stock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Stock</Text>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Cost Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.gray}
                value={cost}
                onChangeText={setCost}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Selling Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.gray}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Stock Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.gray}
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Low Stock Alert</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={COLORS.gray}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Tax Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Information</Text>
          
          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => setTaxable(!taxable)}
          >
            <Text style={styles.label}>Taxable Product</Text>
            <View style={[styles.switch, taxable && styles.switchActive]}>
              <View style={[styles.switchThumb, taxable && styles.switchThumbActive]} />
            </View>
          </TouchableOpacity>

          {taxable && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor={COLORS.gray}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={loading ? ['#D1D5DB', '#9CA3AF'] : ['#D946EF', '#A21CAF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save" size={24} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: COLORS.primaryDark,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 15,
  },
  imageUploadContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changeImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: COLORS.lightBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 15,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  saveButton: {
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ProductManagementScreen;