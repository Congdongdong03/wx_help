# 数据库配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '970325',
    'database': 'bangbang',
    'charset': 'utf8mb4'
}

# Coles网站配置
COLES_CONFIG = {
    'base_url': 'https://www.coles.com.au',
    'catalogue_url': 'https://www.coles.com.au/catalogues',
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# 爬虫配置
SCRAPER_CONFIG = {
    'timeout': 30,
    'retry_times': 3,
    'delay_between_requests': 2,
    'image_quality': 85,  # JPEG质量
    'max_image_size': (1200, 800)  # 最大图片尺寸
}

# 调度配置
SCHEDULE_CONFIG = {
    'run_time': '11:59',  # 每周二11:59运行
    'timezone': 'Australia/Sydney'
}