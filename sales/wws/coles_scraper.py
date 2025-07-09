def save_to_database(self, image_paths):
        """保存到数据库"""
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # 插入新数据
            today = date.today()
            for page_number, file_path in image_paths:
                query = """
                INSERT INTO catalogue_images (store_name, page_number, image_data, week_date)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(query, ('coles', page_number, file_path, today))
            
            connection.commit()
            logging.info(f"成功保存 {len(image_paths)} 条Coles记录到数据库")
            
            cursor.close()
            connection.close()
            return True
            
        except Exception as e:
            logging.error(f"保存到数据库失败: {e}")
            return False#!/usr/bin/env python3
"""
Coles专用爬虫 - 先确保Coles能正常工作
"""

import os
import requests
import time
import logging
from datetime import datetime, date
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from pdf2image import convert_from_bytes
import mysql.connector
from config import DB_CONFIG

class ColesScraper:
    def __init__(self):
        self.setup_logging()
        self.driver = None
        self.images_dir = None  # 添加这个属性
        self.ensure_directories()
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('coles_scraper.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
    
    def ensure_directories(self):
        """确保目录存在"""
        # 修改路径，确保在正确的位置创建目录
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)  # 爬虫目录的上级目录
        
        self.images_dir = os.path.join(project_root, 'public', 'catalogue_images', 'coles')
        os.makedirs(self.images_dir, exist_ok=True)
        
        logging.info(f"Coles图片存储目录: {self.images_dir}")
        logging.info("Coles图片存储目录已准备完毕")
    
    def setup_driver(self):
        """设置Chrome浏览器"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # 无头模式
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            logging.info("Chrome浏览器启动成功")
            return True
            
        except Exception as e:
            logging.error(f"浏览器启动失败: {e}")
            return False
    
    def close_driver(self):
        """关闭浏览器"""
        if self.driver:
            self.driver.quit()
            logging.info("浏览器已关闭")
    
    def get_coles_pdf_url(self):
        """获取Coles PDF链接 - 专门找 'This week's catalogue'"""
        try:
            logging.info("访问Coles目录页面...")
            self.driver.get("https://www.coles.com.au/catalogues")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 方法1：查找"This week's catalogue"文字，然后找Download PDF按钮
            try:
                logging.info("查找 'This week's catalogue' 区域...")
                
                # 查找包含"This week's catalogue"的元素
                this_week_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), \"This week's catalogue\")]")
                
                for element in this_week_elements:
                    logging.info("找到 'This week's catalogue' 文字")
                    
                    # 向上查找父容器
                    parent = element
                    for level in range(10):  # 最多向上查找10层
                        try:
                            # 在当前容器中查找"Download PDF"按钮
                            download_buttons = parent.find_elements(By.XPATH, ".//*[contains(text(), 'Download PDF') or contains(text(), 'download pdf') or contains(text(), 'PDF')]")
                            
                            for button in download_buttons:
                                # 尝试获取链接
                                href = button.get_attribute('href')
                                if not href:
                                    # 如果不是链接，可能是按钮，查找父级链接
                                    button_parent = button.find_element(By.XPATH, "..")
                                    href = button_parent.get_attribute('href')
                                
                                if href and '.pdf' in href.lower():
                                    logging.info(f"通过'This week's catalogue'找到PDF: {href}")
                                    return href
                            
                            # 查找父级
                            parent = parent.find_element(By.XPATH, "..")
                            
                        except:
                            break
                            
            except Exception as e:
                logging.info(f"方法1失败: {e}")
            
            # 方法2：直接查找所有"Download PDF"按钮
            try:
                logging.info("查找所有 'Download PDF' 按钮...")
                
                download_selectors = [
                    "//*[contains(text(), 'Download PDF')]",
                    "//*[contains(text(), 'download pdf')]", 
                    "//*[contains(text(), 'PDF')]",
                    "a[href*='.pdf']",
                    "button[href*='.pdf']"
                ]
                
                for selector in download_selectors:
                    try:
                        if selector.startswith("//"):
                            elements = self.driver.find_elements(By.XPATH, selector)
                        else:
                            elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        
                        for element in elements:
                            href = element.get_attribute('href')
                            if href and '.pdf' in href.lower():
                                logging.info(f"通过选择器找到PDF: {href}")
                                return href
                                
                    except:
                        continue
                        
            except Exception as e:
                logging.info(f"方法2失败: {e}")
            
            # 方法3：查找所有PDF链接（备用）
            try:
                logging.info("备用方案：查找所有PDF链接...")
                all_links = self.driver.find_elements(By.TAG_NAME, "a")
                for link in all_links:
                    href = link.get_attribute('href')
                    if href and '.pdf' in href.lower():
                        logging.info(f"备用方案找到PDF: {href}")
                        return href
                        
            except Exception as e:
                logging.info(f"方法3失败: {e}")
            
            logging.error("未找到 'This week's catalogue' PDF链接")
            return None
            
        except Exception as e:
            logging.error(f"获取Coles PDF失败: {e}")
            return None
    
    def download_pdf(self, pdf_url):
        """下载PDF文件"""
        try:
            logging.info("下载Coles PDF...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            response = requests.get(pdf_url, headers=headers, timeout=60)
            if response.status_code == 200:
                logging.info(f"PDF下载成功，大小: {len(response.content)} bytes")
                return response.content
            else:
                logging.error(f"PDF下载失败: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"PDF下载失败: {e}")
            return None
    
    def pdf_to_images(self, pdf_data):
        """将PDF转换为图片"""
        try:
            logging.info("转换PDF为图片...")
            
            # 使用pdf2image转换PDF
            images = convert_from_bytes(
                pdf_data,
                dpi=150,  # 图片质量
                fmt='JPEG'
            )
            
            logging.info(f"PDF转换成功，共 {len(images)} 页")
            return images
            
        except Exception as e:
            logging.error(f"PDF转换失败: {e}")
            return []
    
    def save_images(self, images):
        """保存图片到本地并返回路径"""
        try:
            today = date.today()
            date_str = today.strftime('%Y%m%d')
            saved_paths = []
            
            for i, image in enumerate(images, 1):
                filename = f"{date_str}_page{i}.jpg"
                file_path = os.path.join(self.images_dir, filename)
                
                # 保存图片
                image.save(file_path, 'JPEG', quality=85)
                
                # 记录数据库路径（用于API返回）
                db_path = f"/catalogue_images/coles/{filename}"
                saved_paths.append((i, db_path))
                
                logging.info(f"保存图片: 第{i}页 -> {file_path}")
            
            return saved_paths
            
        except Exception as e:
            logging.error(f"保存图片失败: {e}")
            return []
    
    def clean_old_files_and_data(self):
        """清除旧的图片文件和数据库记录"""
        try:
            logging.info("开始清理旧数据...")
            
            # 1. 先从数据库获取旧文件路径
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # 查询现有的Coles图片记录
            cursor.execute("SELECT image_data FROM catalogue_images WHERE store_name = 'coles'")
            old_records = cursor.fetchall()
            
            # 2. 删除旧的图片文件
            deleted_files = 0
            for record in old_records:
                file_path = record[0]  # 如: "/catalogue_images/coles/20250605_page1.jpg"
                
                # 转换为实际文件路径
                if file_path.startswith('/catalogue_images/'):
                    relative_path = file_path[1:]  # 去掉开头的 "/"
                    current_dir = os.path.dirname(os.path.abspath(__file__))
                    project_root = os.path.dirname(current_dir)
                    actual_file_path = os.path.join(project_root, 'public', relative_path)
                    
                    # 删除文件
                    if os.path.exists(actual_file_path):
                        try:
                            os.remove(actual_file_path)
                            deleted_files += 1
                            logging.info(f"删除旧文件: {actual_file_path}")
                        except Exception as e:
                            logging.warning(f"删除文件失败 {actual_file_path}: {e}")
            
            logging.info(f"删除了 {deleted_files} 个旧图片文件")
            
            # 3. 删除数据库记录
            cursor.execute("DELETE FROM catalogue_images WHERE store_name = 'coles'")
            deleted_records = cursor.rowcount
            connection.commit()
            logging.info(f"删除了 {deleted_records} 条旧数据库记录")
            
            cursor.close()
            connection.close()
            
            return True
            
        except Exception as e:
            logging.error(f"清理旧数据失败: {e}")
            return False
    
    def run_scraper(self):
        """运行Coles爬虫"""
        try:
            logging.info("=" * 50)
            logging.info("Coles目录爬虫开始运行")
            logging.info(f"运行时间: {datetime.now()}")
            logging.info("=" * 50)
            
            # 清理旧数据和文件
            if not self.clean_old_files_and_data():
                logging.warning("清理旧数据失败，但继续执行...")
            
            # 启动浏览器
            if not self.setup_driver():
                logging.error("浏览器启动失败")
                return False
            
            # 获取PDF URL
            pdf_url = self.get_coles_pdf_url()
            if not pdf_url:
                logging.error("未找到PDF链接")
                return False
            
            # 下载PDF
            pdf_data = self.download_pdf(pdf_url)
            if not pdf_data:
                logging.error("PDF下载失败")
                return False
            
            # 转换为图片
            images = self.pdf_to_images(pdf_data)
            if not images:
                logging.error("PDF转换失败")
                return False
            
            # 保存图片
            image_paths = self.save_images(images)
            if not image_paths:
                logging.error("图片保存失败")
                return False
            
            # 保存到数据库
            if self.save_to_database(image_paths):
                logging.info("🎉 Coles爬虫执行成功！")
                logging.info(f"共处理 {len(image_paths)} 张图片")
                logging.info("✅ 旧文件已清理，新图片已保存")
                return True
            else:
                logging.error("数据库保存失败")
                return False
                
        except Exception as e:
            logging.error(f"爬虫执行失败: {e}")
            return False
            
        finally:
            self.close_driver()

def main():
    """主函数"""
    scraper = ColesScraper()
    success = scraper.run_scraper()
    
    if success:
        logging.info("✅ Coles爬虫执行成功")
        logging.info("🎯 现在可以测试API: http://localhost:3000/api/posts96")
    else:
        logging.error("❌ Coles爬虫执行失败")

if __name__ == "__main__":
    main()