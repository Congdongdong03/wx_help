#!/usr/bin/env python3
"""
简化版测试爬虫 - 直接使用测试图片URL
"""

import mysql.connector
import logging
from datetime import date
from config import DB_CONFIG

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_database_connection():
    """测试数据库连接"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            logging.info("✅ 数据库连接成功")
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            logging.info(f"MySQL版本: {version[0]}")
            cursor.close()
            connection.close()
            return True
        return False
    except Exception as e:
        logging.error(f"❌ 数据库连接失败: {e}")
        return False

def clear_old_data():
    """清除旧数据"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute("DELETE FROM catalogue_images")
        connection.commit()
        deleted_count = cursor.rowcount
        logging.info(f"🗑️ 删除了 {deleted_count} 条旧记录")
        cursor.close()
        connection.close()
        return True
    except Exception as e:
        logging.error(f"❌ 清除数据失败: {e}")
        return False

def insert_test_data():
    """插入测试数据（使用网络图片URL）"""
    # 使用免费的图片API作为测试数据
    test_images = [
        ('coles', 1, 'https://picsum.photos/800/600?random=1'),
        ('coles', 2, 'https://picsum.photos/800/600?random=2'),
        ('coles', 3, 'https://picsum.photos/800/600?random=3'),
        ('coles', 4, 'https://picsum.photos/800/600?random=4'),
        ('woolworths', 1, 'https://picsum.photos/800/600?random=5'),
        ('woolworths', 2, 'https://picsum.photos/800/600?random=6'),
        ('woolworths', 3, 'https://picsum.photos/800/600?random=7'),
    ]
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        today = date.today()
        
        for store_name, page_number, image_url in test_images:
            query = """
            INSERT INTO catalogue_images (store_name, page_number, image_data, week_date)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (store_name, page_number, image_url, today))
            logging.info(f"✅ 插入成功: {store_name} 第{page_number}页")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        logging.info(f"🎉 成功插入 {len(test_images)} 张测试图片")
        return True
        
    except Exception as e:
        logging.error(f"❌ 插入数据失败: {e}")
        return False

def verify_data():
    """验证数据"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        cursor.execute("SELECT store_name, page_number, LEFT(image_data, 50) FROM catalogue_images ORDER BY store_name, page_number")
        results = cursor.fetchall()
        
        logging.info("📊 数据库中的图片记录:")
        for store, page, url_preview in results:
            logging.info(f"  {store} 第{page}页: {url_preview}...")
        
        cursor.close()
        connection.close()
        
        return len(results) > 0
        
    except Exception as e:
        logging.error(f"❌ 验证数据失败: {e}")
        return False

def main():
    """主函数"""
    logging.info("🚀 开始运行简化测试爬虫...")
    
    # 1. 测试数据库连接
    if not test_database_connection():
        logging.error("❌ 数据库连接失败，爬虫停止")
        return
    
    # 2. 清除旧数据
    if not clear_old_data():
        logging.error("❌ 清除旧数据失败")
        return
    
    # 3. 插入测试数据
    if not insert_test_data():
        logging.error("❌ 插入测试数据失败")
        return
    
    # 4. 验证数据
    if verify_data():
        logging.info("✅ 测试爬虫运行成功！")
        logging.info("🎯 现在可以在小程序中测试目录图片功能了")
    else:
        logging.error("❌ 数据验证失败")

if __name__ == "__main__":
    main()