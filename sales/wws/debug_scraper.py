#!/usr/bin/env python3
"""
调试版爬虫 - 帮助分析网站结构
"""

import os
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class DebugScraper:
    def __init__(self):
        self.setup_logging()
        self.driver = None
    
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    
    def setup_driver(self):
        try:
            chrome_options = Options()
            # 注释掉headless，这样可以看到浏览器
            # chrome_options.add_argument('--headless')  
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            
            logging.info("Chrome浏览器启动成功")
            return True
            
        except Exception as e:
            logging.error(f"浏览器启动失败: {e}")
            return False
    
    def debug_coles(self):
        """调试Coles网站"""
        try:
            logging.info("=== 调试Coles网站 ===")
            self.driver.get("https://www.coles.com.au/catalogues")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 保存页面截图
            self.driver.save_screenshot("coles_page.png")
            logging.info("Coles页面截图已保存: coles_page.png")
            
            # 查找所有包含"catalogue"的文本
            elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'catalogue') or contains(text(), 'Catalogue')]")
            logging.info(f"找到 {len(elements)} 个包含'catalogue'的元素")
            
            for i, element in enumerate(elements[:10]):  # 只显示前10个
                try:
                    text = element.text.strip()
                    if text:
                        logging.info(f"  {i+1}. {text}")
                except:
                    pass
            
            # 查找所有PDF链接
            all_links = self.driver.find_elements(By.TAG_NAME, "a")
            pdf_links = []
            for link in all_links:
                href = link.get_attribute('href')
                if href and '.pdf' in href.lower():
                    pdf_links.append(href)
            
            logging.info(f"找到 {len(pdf_links)} 个PDF链接:")
            for i, pdf_link in enumerate(pdf_links):
                logging.info(f"  {i+1}. {pdf_link}")
            
            return pdf_links
            
        except Exception as e:
            logging.error(f"调试Coles失败: {e}")
            return []
    
    def debug_woolworths(self):
        """调试Woolworths网站"""
        try:
            logging.info("=== 调试Woolworths网站 ===")
            self.driver.get("https://www.woolworths.com.au/shop/catalogue")
            
            # 等待页面加载
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 保存页面截图
            self.driver.save_screenshot("woolworths_page.png")
            logging.info("Woolworths页面截图已保存: woolworths_page.png")
            
            # 查找所有包含"catalogue"的文本
            elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'catalogue') or contains(text(), 'Catalogue')]")
            logging.info(f"找到 {len(elements)} 个包含'catalogue'的元素")
            
            for i, element in enumerate(elements[:10]):
                try:
                    text = element.text.strip()
                    if text:
                        logging.info(f"  {i+1}. {text}")
                except:
                    pass
            
            # 查找所有PDF链接
            all_links = self.driver.find_elements(By.TAG_NAME, "a")
            pdf_links = []
            for link in all_links:
                href = link.get_attribute('href')
                if href and '.pdf' in href.lower():
                    pdf_links.append(href)
            
            logging.info(f"找到 {len(pdf_links)} 个PDF链接:")
            for i, pdf_link in enumerate(pdf_links):
                logging.info(f"  {i+1}. {pdf_link}")
            
            return pdf_links
            
        except Exception as e:
            logging.error(f"调试Woolworths失败: {e}")
            return []
    
    def run_debug(self):
        """运行调试"""
        if not self.setup_driver():
            return
        
        try:
            # 调试Coles
            coles_pdfs = self.debug_coles()
            
            input("按Enter继续调试Woolworths...")  # 暂停，让你看看结果
            
            # 调试Woolworths  
            woolworths_pdfs = self.debug_woolworths()
            
            input("按Enter关闭浏览器...")
            
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    scraper = DebugScraper()
    scraper.run_debug()