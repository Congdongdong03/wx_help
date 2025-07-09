#!/usr/bin/env python3
"""
Coles专用爬虫 - 修复路径版本
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
        self.images_dir = None
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
        """确保目录存在 - 修复路径"""
        import os
        
        # 获取当前脚本所在目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        logging.info(f"当前脚本目录: {current_dir}")
        
        # 方法1：如果爬虫在 server/src/ 目录下
        if 'server' in current_dir and 'src' in current_dir:
            # 直接在当前目录创建 public 文件夹
            self.images_dir = os.path.join(current_dir, 'public', 'catalogue_images', 'coles')
        else:
            # 方法2：手动指定到正确的路径
            # 根据你的API路径，应该是 server/src/public/catalogue_images/coles/
            server_src_dir = "/Users/wesley/Desktop/帮帮/wx_help/server/src"
            if os.path.exists(server_src_dir):
                self.images_dir = os.path.join(server_src_dir, 'public', 'catalogue_images', 'coles')
            else:
                # 如果找不到，就在当前目录的上级创建
                project_root = os.path.dirname(current_dir)
                self.images_dir = os.path.join(project_root, 'server', 'src', 'public', 'catalogue_images', 'coles')
        
        # 创建目录
        os.makedirs(self.images_dir, exist_ok=True)
        
        logging.info("=" * 60)
        logging.info(f"✅ Coles图片存储目录: {self.images_dir}")
        logging.info(f"✅ 目录是否存在: {os.path.exists(self.images_dir)}")
        logging.info("=" * 60)
    
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
            
            logging.info("✅ Chrome浏览器启动成功")
            return True
            
        except Exception as e:
            logging.error(f"❌ 浏览器启动失败: {e}")
            return False
    
    def close_driver(self):
        """关闭浏览器"""
        if self.driver:
            self.driver.quit()
            logging.info("🔒 浏览器已关闭")
    
    def clean_old_files(self):
        """清理旧图片文件"""
        try:
            if os.path.exists(self.images_dir):
                files = [f for f in os.listdir(self.images_dir) if f.endswith(('.jpg', '.jpeg'))]
                for file in files:
                    file_path = os.path.join(self.images_dir, file)
                    os.remove(file_path)
                    logging.info(f"🗑️ 删除旧文件: {file}")
                logging.info(f"🧹 清理完成，删除了 {len(files)} 个文件")
            return True
        except Exception as e:
            logging.error(f"❌ 清理旧文件失败: {e}")
            return False
    
    def get_coles_pdf_url(self):
        """获取Coles PDF链接"""
        try:
            logging.info("🌐 访问Coles目录页面...")
            self.driver.get("https://www.coles.com.au/catalogues")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 多种方法查找PDF链接
            methods = [
                ("查找'This week's catalogue'", self._find_this_week_catalogue),
                ("查找Download PDF按钮", self._find_download_pdf_buttons),
                ("查找所有PDF链接", self._find_all_pdf_links)
            ]
            
            for method_name, method_func in methods:
                try:
                    logging.info(f"🔍 {method_name}...")
                    pdf_url = method_func()
                    if pdf_url:
                        logging.info(f"✅ {method_name}成功: {pdf_url}")
                        return pdf_url
                except Exception as e:
                    logging.warning(f"⚠️ {method_name}失败: {e}")
                    continue
            
            logging.error("❌ 未找到PDF链接")
            return None
            
        except Exception as e:
            logging.error(f"❌ 获取PDF链接失败: {e}")
            return None
    
    def _find_this_week_catalogue(self):
        """方法1：查找'This week's catalogue'"""
        this_week_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), \"This week's catalogue\")]")
        
        for element in this_week_elements:
            parent = element
            for level in range(10):
                try:
                    download_buttons = parent.find_elements(By.XPATH, ".//*[contains(text(), 'Download PDF') or contains(text(), 'download pdf') or contains(text(), 'PDF')]")
                    
                    for button in download_buttons:
                        href = button.get_attribute('href')
                        if not href:
                            button_parent = button.find_element(By.XPATH, "..")
                            href = button_parent.get_attribute('href')
                        
                        if href and '.pdf' in href.lower():
                            return href
                    
                    parent = parent.find_element(By.XPATH, "..")
                except:
                    break
        return None
    
    def _find_download_pdf_buttons(self):
        """方法2：查找Download PDF按钮"""
        selectors = [
            "//*[contains(text(), 'Download PDF')]",
            "//*[contains(text(), 'download pdf')]", 
            "//*[contains(text(), 'PDF')]",
            "a[href*='.pdf']",
            "button[href*='.pdf']"
        ]
        
        for selector in selectors:
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                
                for element in elements:
                    href = element.get_attribute('href')
                    if href and '.pdf' in href.lower():
                        return href
            except:
                continue
        return None
    
    def _find_all_pdf_links(self):
        """方法3：查找所有PDF链接"""
        all_links = self.driver.find_elements(By.TAG_NAME, "a")
        for link in all_links:
            href = link.get_attribute('href')
            if href and '.pdf' in href.lower():
                return href
        return None
    
    def download_pdf(self, pdf_url):
        """下载PDF文件"""
        try:
            logging.info("📥 下载Coles PDF...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            response = requests.get(pdf_url, headers=headers, timeout=60)
            if response.status_code == 200:
                size_mb = len(response.content) / (1024 * 1024)
                logging.info(f"✅ PDF下载成功，大小: {size_mb:.2f} MB")
                return response.content
            else:
                logging.error(f"❌ PDF下载失败: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"❌ PDF下载失败: {e}")
            return None
    
    def pdf_to_images(self, pdf_data):
        """将PDF转换为图片"""
        try:
            logging.info("🔄 转换PDF为图片...")
            
            images = convert_from_bytes(
                pdf_data,
                dpi=150,  # 图片质量
                fmt='JPEG'
            )
            
            logging.info(f"✅ PDF转换成功，共 {len(images)} 页")
            return images
            
        except Exception as e:
            logging.error(f"❌ PDF转换失败: {e}")
            return []
    
    def save_images(self, images):
        """保存图片到本地并返回路径"""
        try:
            today = date.today()
            date_str = today.strftime('%Y%m%d')
            saved_paths = []
            
            logging.info(f"💾 开始保存 {len(images)} 张图片到: {self.images_dir}")
            
            for i, image in enumerate(images, 1):
                filename = f"{date_str}_page{i}.jpg"
                file_path = os.path.join(self.images_dir, filename)
                
                # 保存图片
                image.save(file_path, 'JPEG', quality=85)
                
                # 数据库路径（API使用）
                db_path = f"/catalogue_images/coles/{filename}"
                saved_paths.append((i, db_path))
                
                logging.info(f"📄 第{i}页: {filename} ({os.path.getsize(file_path)} bytes)")
            
            logging.info(f"✅ 所有图片保存完成")
            return saved_paths
            
        except Exception as e:
            logging.error(f"❌ 保存图片失败: {e}")
            return []
    
    def save_to_database(self, image_paths):
        """保存到数据库"""
        try:
            logging.info("💾 保存到数据库...")
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # 清除旧的Coles数据
            cursor.execute("DELETE FROM catalogue_images WHERE store_name = 'coles'")
            deleted_count = cursor.rowcount
            logging.info(f"🗑️ 删除了 {deleted_count} 条旧的Coles记录")
            
            # 插入新数据
            today = date.today()
            success_count = 0
            for page_number, file_path in image_paths:
                query = """
                INSERT INTO catalogue_images (store_name, page_number, image_data, week_date)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(query, ('coles', page_number, file_path, today))
                success_count += 1
            
            connection.commit()
            cursor.close()
            connection.close()
            
            logging.info(f"✅ 成功保存 {success_count} 条Coles记录到数据库")
            return True
            
        except Exception as e:
            logging.error(f"❌ 保存到数据库失败: {e}")
            return False
    
    def run_scraper(self):
        """运行Coles爬虫主流程"""
        try:
            logging.info("🚀" + "=" * 50)
            logging.info("🛒 Coles自动化爬虫开始运行")
            logging.info(f"⏰ 运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            logging.info("🚀" + "=" * 50)
            
            # 步骤1：清理旧文件
            self.clean_old_files()
            
            # 步骤2：启动浏览器
            if not self.setup_driver():
                logging.error("❌ 浏览器启动失败")
                return False
            
            # 步骤3：获取PDF URL
            pdf_url = self.get_coles_pdf_url()
            if not pdf_url:
                logging.error("❌ 未找到PDF链接")
                return False
            
            # 步骤4：下载PDF
            pdf_data = self.download_pdf(pdf_url)
            if not pdf_data:
                logging.error("❌ PDF下载失败")
                return False
            
            # 步骤5：转换为图片
            images = self.pdf_to_images(pdf_data)
            if not images:
                logging.error("❌ PDF转换失败")
                return False
            
            # 步骤6：保存图片
            image_paths = self.save_images(images)
            if not image_paths:
                logging.error("❌ 图片保存失败")
                return False
            
            # 步骤7：保存到数据库
            if not self.save_to_database(image_paths):
                logging.error("❌ 数据库保存失败")
                return False
            
            # 成功完成
            logging.info("🎉" + "=" * 50)
            logging.info("🎉 Coles爬虫执行成功！")
            logging.info(f"📊 共处理 {len(image_paths)} 张图片")
            logging.info(f"📁 图片保存在: {self.images_dir}")
            logging.info("🔗 现在可以通过以下方式访问：")
            logging.info("   - API: http://localhost:3000/api/debug/catalogue-images")
            logging.info("   - 直接访问: http://localhost:3000/catalogue_images/coles/")
            logging.info("🎉" + "=" * 50)
            return True
                
        except Exception as e:
            logging.error(f"❌ 爬虫执行失败: {e}")
            return False
            
        finally:
            self.close_driver()

def main():
    """主函数"""
    print("🛒 Coles自动化爬虫启动中...")
    
    scraper = ColesScraper()
    success = scraper.run_scraper()
    
    if success:
        print("\n" + "🎉" * 20)
        print("✅ Coles爬虫执行成功！")
        print("🎯 现在可以测试API了")
        print("🎉" * 20)
    else:
        print("\n❌ Coles爬虫执行失败，请检查日志")

if __name__ == "__main__":
    main()