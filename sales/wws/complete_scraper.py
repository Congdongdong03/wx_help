#!/usr/bin/env python3
"""
完整超市目录爬虫 - Coles + Woolworths
每周三自动运行，爬取PDF目录并转换为图片
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
import schedule

class SupermarketScraper:
    def __init__(self):
        self.setup_logging()
        self.driver = None
        self.ensure_directories()
    
    def setup_logging(self):
        """设置日志"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('supermarket_scraper.log', encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
    
    def ensure_directories(self):
        """确保目录存在"""
        os.makedirs('../public/catalogue_images/coles', exist_ok=True)
        os.makedirs('../public/catalogue_images/woolworths', exist_ok=True)
        logging.info("图片存储目录已准备完毕")
    
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
    
    def scrape_coles_catalogue(self):
        """爬取Coles目录 - 使用第一个PDF链接"""
        try:
            logging.info("开始爬取Coles目录...")
            self.driver.get("https://www.coles.com.au/catalogues")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "a"))
            )
            
            # 查找所有PDF链接
            all_links = self.driver.find_elements(By.TAG_NAME, "a")
            pdf_links = []
            for link in all_links:
                href = link.get_attribute('href')
                if href and '.pdf' in href.lower():
                    pdf_links.append(href)
            
            if pdf_links:
                # 使用第一个PDF链接（通常是主要目录）
                main_pdf = pdf_links[0]
                logging.info(f"找到Coles主目录PDF: {main_pdf}")
                return main_pdf
            
            logging.error("未找到Coles PDF链接")
            return None
            
        except Exception as e:
            logging.error(f"爬取Coles目录失败: {e}")
            return None
    
    def scrape_woolworths_catalogue(self):
        """爬取Woolworths目录 - 先设置邮编再找PDF"""
        try:
            logging.info("开始爬取Woolworths目录...")
            self.driver.get("https://www.woolworths.com.au/shop/catalogue")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 尝试设置邮编（如果需要的话）
            try:
                # 查找邮编输入框
                postcode_selectors = [
                    'input[placeholder*="postcode"]',
                    'input[placeholder*="Postcode"]', 
                    'input[name*="postcode"]',
                    'input[id*="postcode"]'
                ]
                
                postcode_input = None
                for selector in postcode_selectors:
                    try:
                        postcode_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                        break
                    except:
                        continue
                
                if postcode_input:
                    logging.info("找到邮编输入框，设置默认邮编...")
                    postcode_input.clear()
                    postcode_input.send_keys("2000")  # 悉尼CBD邮编
                    
                    # 查找提交按钮
                    submit_selectors = [
                        'button[type="submit"]',
                        'button:contains("Submit")',
                        'button:contains("Go")',
                        '.submit-button'
                    ]
                    
                    for selector in submit_selectors:
                        try:
                            submit_btn = self.driver.find_element(By.CSS_SELECTOR, selector)
                            submit_btn.click()
                            logging.info("已提交邮编")
                            time.sleep(3)  # 等待页面更新
                            break
                        except:
                            continue
                            
            except Exception as e:
                logging.info(f"设置邮编失败，继续查找PDF: {e}")
            
            # 查找PDF链接
            all_links = self.driver.find_elements(By.TAG_NAME, "a")
            pdf_links = []
            for link in all_links:
                href = link.get_attribute('href')
                if href and '.pdf' in href.lower():
                    pdf_links.append(href)
            
            if pdf_links:
                logging.info(f"找到Woolworths PDF: {pdf_links[0]}")
                return pdf_links[0]
            
            # 如果还是没找到，尝试其他方法
            logging.info("尝试查找其他格式的目录链接...")
            
            # 查找可能的目录页面链接
            catalogue_links = []
            for link in all_links:
                href = link.get_attribute('href')
                if href and ('catalogue' in href.lower() or 'catalog' in href.lower()):
                    catalogue_links.append(href)
            
            if catalogue_links:
                logging.info(f"找到 {len(catalogue_links)} 个目录相关链接")
                # 访问第一个目录链接，看看是否有PDF
                self.driver.get(catalogue_links[0])
                time.sleep(3)
                
                # 再次查找PDF
                all_links = self.driver.find_elements(By.TAG_NAME, "a")
                for link in all_links:
                    href = link.get_attribute('href')
                    if href and '.pdf' in href.lower():
                        logging.info(f"在子页面找到Woolworths PDF: {href}")
                        return href
            
            logging.error("未找到Woolworths PDF链接")
            return None
            
        except Exception as e:
            logging.error(f"爬取Woolworths目录失败: {e}")
            return None
    
    def download_pdf(self, pdf_url, store_name):
        """下载PDF文件"""
        try:
            logging.info(f"正在下载 {store_name} PDF...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            response = requests.get(pdf_url, headers=headers, timeout=60)
            if response.status_code == 200:
                logging.info(f"{store_name} PDF下载成功，大小: {len(response.content)} bytes")
                return response.content
            else:
                logging.error(f"{store_name} PDF下载失败: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            logging.error(f"{store_name} PDF下载失败: {e}")
            return None
    
    def pdf_to_images(self, pdf_data, store_name):
        """将PDF转换为图片"""
        try:
            logging.info(f"正在转换 {store_name} PDF为图片...")
            
            # 使用pdf2image转换PDF
            images = convert_from_bytes(
                pdf_data,
                dpi=150,  # 图片质量
                fmt='JPEG'
            )
            
            logging.info(f"{store_name} PDF转换成功，共 {len(images)} 页")
            return images
            
        except Exception as e:
            logging.error(f"{store_name} PDF转换失败: {e}")
            return []
    
    def save_images_to_disk(self, images, store_name):
        """保存图片到本地磁盘"""
        try:
            today = date.today()
            date_str = today.strftime('%Y%m%d')
            saved_paths = []
            
            for i, image in enumerate(images, 1):
                filename = f"{date_str}_page{i}.jpg"
                file_path = f"../public/catalogue_images/{store_name}/{filename}"
                
                # 保存图片
                image.save(file_path, 'JPEG', quality=85)
                
                # 记录数据库路径
                db_path = f"/catalogue_images/{store_name}/{filename}"
                saved_paths.append((i, db_path))
                
                logging.info(f"保存成功: {store_name} 第{i}页 -> {file_path}")
            
            return saved_paths
            
        except Exception as e:
            logging.error(f"保存 {store_name} 图片失败: {e}")
            return []
    
    def save_to_database(self, store_name, image_paths):
        """保存图片路径到数据库"""
        try:
            connection = mysql.connector.connect(**DB_CONFIG)
            cursor = connection.cursor()
            
            # 清除旧数据
            cursor.execute("DELETE FROM catalogue_images WHERE store_name = %s", (store_name,))
            deleted_count = cursor.rowcount
            logging.info(f"删除了 {deleted_count} 条旧的 {store_name} 记录")
            
            # 插入新数据
            today = date.today()
            for page_number, file_path in image_paths:
                query = """
                INSERT INTO catalogue_images (store_name, page_number, image_data, week_date)
                VALUES (%s, %s, %s, %s)
                """
                cursor.execute(query, (store_name, page_number, file_path, today))
            
            connection.commit()
            logging.info(f"成功保存 {len(image_paths)} 条 {store_name} 记录到数据库")
            
            cursor.close()
            connection.close()
            return True
            
        except Exception as e:
            logging.error(f"保存 {store_name} 数据到数据库失败: {e}")
            return False
    
    def scrape_store(self, store_name):
        """爬取单个商店的目录"""
        try:
            logging.info(f"开始处理 {store_name}...")
            
            # 获取PDF URL
            if store_name == 'coles':
                pdf_url = self.scrape_coles_catalogue()
            elif store_name == 'woolworths':
                pdf_url = self.scrape_woolworths_catalogue()
            else:
                logging.error(f"未知的商店名称: {store_name}")
                return False
            
            if not pdf_url:
                logging.error(f"未找到 {store_name} 的PDF链接")
                return False
            
            # 下载PDF
            pdf_data = self.download_pdf(pdf_url, store_name)
            if not pdf_data:
                return False
            
            # 转换为图片
            images = self.pdf_to_images(pdf_data, store_name)
            if not images:
                return False
            
            # 保存图片到磁盘
            image_paths = self.save_images_to_disk(images, store_name)
            if not image_paths:
                return False
            
            # 保存路径到数据库
            if self.save_to_database(store_name, image_paths):
                logging.info(f"✅ {store_name} 处理完成！")
                return True
            else:
                return False
                
        except Exception as e:
            logging.error(f"处理 {store_name} 失败: {e}")
            return False
    
    def run_full_scraper(self):
        """运行完整爬虫"""
        try:
            logging.info("=" * 60)
            logging.info("超市目录爬虫开始运行")
            logging.info(f"运行时间: {datetime.now()}")
            logging.info("=" * 60)
            
            # 启动浏览器
            if not self.setup_driver():
                logging.error("浏览器启动失败，爬虫停止")
                return
            
            # 爬取Coles
            coles_success = self.scrape_store('coles')
            time.sleep(5)  # 间隔
            
            # 爬取Woolworths
            woolworths_success = self.scrape_store('woolworths')
            
            # 总结
            if coles_success and woolworths_success:
                logging.info("🎉 所有商店爬取成功！")
            elif coles_success or woolworths_success:
                logging.info("⚠️ 部分商店爬取成功")
            else:
                logging.error("❌ 所有商店爬取失败")
            
        except Exception as e:
            logging.error(f"爬虫运行失败: {e}")
            
        finally:
            self.close_driver()

def scheduled_job():
    """定时任务"""
    logging.info("定时任务触发：开始执行爬虫")
    scraper = SupermarketScraper()
    scraper.run_full_scraper()

def main():
    """主函数"""
    # 立即运行一次（测试用）
    logging.info("立即运行一次爬虫（测试）...")
    scraper = SupermarketScraper()
    scraper.run_full_scraper()
    
    # 设置定时任务：每周三运行
    schedule.every().wednesday.at("10:00").do(scheduled_job)
    logging.info("定时任务已设置：每周三10:00自动运行")
    
    # 保持程序运行
    while True:
        schedule.run_pending()
        time.sleep(60)  # 每分钟检查一次

if __name__ == "__main__":
    main()