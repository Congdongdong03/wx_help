import mysql.connector
from mysql.connector import Error
import base64
from datetime import datetime, date
from config import DB_CONFIG
import logging

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """连接数据库"""
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            if self.connection.is_connected():
                logging.info("数据库连接成功")
        except Error as e:
            logging.error(f"数据库连接失败: {e}")
            self.connection = None
    
    def disconnect(self):
        """断开数据库连接"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logging.info("数据库连接已断开")
    
    def clear_old_images(self, store_name):
        """清除旧的目录图片"""
        try:
            cursor = self.connection.cursor()
            query = "DELETE FROM catalogue_images WHERE store_name = %s"
            cursor.execute(query, (store_name,))
            self.connection.commit()
            deleted_count = cursor.rowcount
            logging.info(f"删除了 {deleted_count} 张旧的 {store_name} 图片")
            cursor.close()
            return True
        except Error as e:
            logging.error(f"清除旧图片失败: {e}")
            return False
    
    def save_image(self, store_name, page_number, image_data, week_date):
        """保存图片到数据库"""
        try:
            cursor = self.connection.cursor()
            
            # 将图片转换为base64
            if isinstance(image_data, bytes):
                base64_data = base64.b64encode(image_data).decode('utf-8')
            else:
                base64_data = image_data
            
            # 完整的base64数据URI
            full_base64 = f"data:image/jpeg;base64,{base64_data}"
            
            query = """
            INSERT INTO catalogue_images (store_name, page_number, image_data, week_date)
            VALUES (%s, %s, %s, %s)
            """
            
            cursor.execute(query, (store_name, page_number, full_base64, week_date))
            self.connection.commit()
            
            logging.info(f"保存图片成功: {store_name} 第{page_number}页")
            cursor.close()
            return True
            
        except Error as e:
            logging.error(f"保存图片失败: {e}")
            return False
    
    def get_images_count(self, store_name):
        """获取指定商店的图片数量"""
        try:
            cursor = self.connection.cursor()
            query = "SELECT COUNT(*) FROM catalogue_images WHERE store_name = %s"
            cursor.execute(query, (store_name,))
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Error as e:
            logging.error(f"获取图片数量失败: {e}")
            return 0
    
    def test_connection(self):
        """测试数据库连接"""
        try:
            if self.connection and self.connection.is_connected():
                cursor = self.connection.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                cursor.close()
                return result[0] == 1
            return False
        except Error as e:
            logging.error(f"数据库连接测试失败: {e}")
            return False