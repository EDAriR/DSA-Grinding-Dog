import random

def create_card_pool(low_prob_cards, mid_prob_cards, high_prob_cards):
    # 按照機率將卡片加入總卡池
    card_pool = low_prob_cards * 3 + mid_prob_cards * 17 + high_prob_cards * 80
    random.shuffle(card_pool)
    return card_pool

def draw_cards(card_pool, low_prob_cards, draw_count, total_draws):
    results = []
    for _ in range(draw_count):
        total_draws += 1
        if total_draws % 100 == 0:
            # 每100次抽取，必定從3%機率卡池中抽取一張
            card = random.choice(low_prob_cards)
        else:
            card = random.choice(card_pool)
        results.append(card)
    return results, total_draws

# 定義三個機率列表
low_prob_cards = ['Low1', 'Low2', 'Low3']  # 3%
mid_prob_cards = ['Mid1', 'Mid2', 'Mid3', 'Mid4', 'Mid5', 'Mid6', 'Mid7']  # 17%
high_prob_cards = ['High1', 'High2', 'High3', 'High4', 'High5', 'High6', 'High7', 'High8', 'High9', 'High10']  # 80%

# 創建卡池
card_pool = create_card_pool(low_prob_cards, mid_prob_cards, high_prob_cards)

# 抽卡示例
total_draws = 0  # 紀錄總抽卡次數
draw_count = int(input("請輸入抽卡次數（1-10）："))
cards_drawn, total_draws = draw_cards(card_pool, low_prob_cards, draw_count, total_draws)

print("您抽到的卡片：", cards_drawn)
