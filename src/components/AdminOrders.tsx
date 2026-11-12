import { useEffect, useState } from 'react';
import { Eye, Clock, CheckCircle, Truck, XCircle, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Order } from '@/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: status as Order['status'] });
    }
    fetchOrders();
  };

  // ১. এক্সেল (XLSX) এক্সপোর্ট ফাংশন (আপনার নির্দিষ্ট ফিল্টার অনুযায়ী)
  const exportToExcel = () => {
    const exportData: any[] = [];

    orders.forEach((o: any, index: number) => {
      const orderDate = new Date(o.created_at).toLocaleString('en-IN');
      const orderId = o.order_number || o.id;
      const customerName = o.customer_name || 'গ্রাহক';
      const mobileNumber = o.customer_phone || o.mobile_number || 'N/A';
      const emailId = o.email || o.customer_email || 'N/A';
      const address = o.customer_address || o.address || 'N/A';
      const latLong = o.lat_long || o.coordinates || 'N/A';
      const status = o.status;

      if (o.order_items && o.order_items.length > 0) {
        o.order_items.forEach((item: any) => {
          exportData.push({
            'Sl': exportData.length + 1,
            'অর্ডার ডেট': orderDate,
            'অর্ডার আইডি': orderId,
            'কাস্টমার নেম': customerName,
            'মোবাইল নাম্বার': mobileNumber,
            'ইমেল আইডি': emailId,
            'কাস্টমার এড্রেস': address,
            'ল্যাট-লং': latLong,
            'পণ্যের বিবরণ': item.product_name || item.name || 'Product',
            'পণ্যের দাম (₹)': Number(item.price) || 0,
            'কোয়ান্টিটি': Number(item.quantity) || 1,
            'ইউনিট': item.pack_size || item.unit || 'pcs',
            'সর্বমোট (₹)': Number(o.total) || 0,
            'স্ট্যাটাস': status,
          });
        });
      } else {
        exportData.push({
          'Sl': exportData.length + 1,
          'অর্ডার ডেট': orderDate,
          'অর্ডার আইডি': orderId,
          'কাস্টমার নেম': customerName,
          'মোবাইল নাম্বার': mobileNumber,
          'ইমেল আইডি': emailId,
          'কাস্টমার এড্রেস': address,
          'ল্যাট-লং': latLong,
          'পণ্যের বিবরণ': 'N/A',
          'পণ্যের দাম (₹)': 0,
          'কোয়ান্টিটি': 0,
          'ইউনিট': 'N/A',
          'সর্বমোট (₹)': Number(o.total) || 0,
          'স্ট্যাটাস': status,
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const
      
