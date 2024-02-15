## 事件交易：現金增資放空

### 菲式思考
====

在菲式思考中，有一隻策略是「大現增快繳款結束」，與這支現金增資放空不謀而合。

看過菲式思考的讀者不妨再重溫一下這隻策略，用不同的角度看待一隻策略，偶爾也會有不同的想法。

這次有榮幸能跟菲式思考從不同角度出發，最終得到了類似的結論，可謂英雄所見略同。

### 什麼是增資
=====

現金增資是一家上市公司再次發行新股票的動作，通常目的是籌集更多的資金，以支持公司的營運或投資計劃。現金增資的方式包括員工認股、原股東認購以及公開承銷（抽籤）。

以下是有關現金增資的一些重要資訊：

1.  **增資目的**：公司通常會進行現金增資，以籌措資金用於擴展業務、進行收購、償還債務或其他投資計劃。增資的目的可以是為了支持公司的成長或處理財務需求。
2.  **增資方式**：公司可以透過員工認股、原股東認購和公開承銷（抽籤）等方式進行現金增資。這些方式都有不同的參與條件和程序。
3.  **認股價格**：認股價格是投資者購買新股票的價格。通常，認股價格會略低於市場上正在交易的股票價格，這是為了吸引投資者參與現金增資。
4.  **增資對股價的影響**：現金增資可能會對現有股東造成股權稀釋，因為公司發行了更多的股票。這可能會對股價產生負面影響，尤其是當增資價格低於市場價格時。然而，如果公司成功使用增資資金實現增長，股價可能會在長期內受益。
5.  **增資的頻率**：公司可以根據需要進行現金增資，但不應該過度依賴這種方式。頻繁的現金增資可能被視為公司財務健康的不良信號，因此應謹慎使用。
6.  **投資決策**：如果您考慮參與現金增資，首先應該了解公司的動機和計劃。如果公司有良好的增長前景，並且增資價格相對合理，那麼參與可能是有利可圖的。然而，您應該謹慎選擇，並評估公司的長期潛力。

總之，現金增資是上市公司為籌措額外資金而發行新股票的過程。投資者應該仔細考慮參與增資的風險和潛在回報，並在做出投資決策之前充分了解公司的情況。

關於增資的細節，可以參考[市場先生](https://rich01.com/blog-post_23-7/)。

### 回測統計 — 敘述性統計
============

下列是增資事件的異常報酬率，可以觀察到，自從增資繳款結束後，股價變長期下跌。

![image 7](https://www.finlab.tw/wp-content/uploads/2023/09/image-7-1024x485.png "事件交易：現金增資放空 1")

### 相關因子分析 — 橫斷面回歸
==============

以下是各種因子和相關的回歸結果，用於分析績效的可能影響因素：

*   Y: 從增資日開始，到增資後二十天的累積異常報酬率
*   X1: 增資前二十日累積周轉率
*   X2: 增資前十日累積周轉率
*   X3: 增資前五日累積周轉率
*   X4: 增發股數 / 已公開發行股數
*   X5: 增資前一日成交量 / 過去前二十日成交量
*   X6: 增資前一日成交量 / 過去前五日成交量
*   X7: 增資前累積二十日報酬率

![image 8](https://www.finlab.tw/wp-content/uploads/2023/09/image-8.png "事件交易：現金增資放空 2")

可以觀察到 X4 的影響很顯著，也間接驗證了「越大的現金增資，越容易造成股價下跌」。

### 交易策略
====

對於採用全空頭策略而言，這個策略表現相當令人滿意。它主要包括 alpha 投資，並且還有大量的負 beta 成分，當與多頭策略結合使用時，可以有效地對避險進行管理。

```
    from pandas.core.indexing import convert_from_missing_indexer_tuple
    from finlab import data
    from finlab.backtest import sim
    import pandas as pd
    
    import datetime
    
    close = data.get("price:收盤價")
    
    price_book_ratio = data.get("price_earning_ratio:股價淨值比")
    net_value = close / price_book_ratio
    
    dividend_info = data.get('dividend_announcement')
    dividend_info.dropna(subset=['除權交易日'], how='all', inplace=True)
    dividend_info.dropna(subset=['stock_id'], how='all', inplace=True)
    
    dividend_info = dividend_info.drop_duplicates(['stock_id', '除權交易日'])
    capital_increment = pd.pivot_table(dividend_info, columns='stock_id', index='除權交易日', values="現金增資總股數(股)")
    capital_increment = capital_increment.fillna(0) * (close >= 0)
    
    company_info = data.get('company_basic_info')
    stock_amount = pd.DataFrame(
      [[stocks for stocks in company_info['已發行普通股數或TDR原發行股數']] for _ in range(len(close.index))],
      columns=company_info['stock_id']
    )
    stock_amount = stock_amount.set_index(close.index)
    
    increment_ratio = capital_increment / stock_amount
    position = increment_ratio > 0.1
    position = position.shift(-5).fillna(False)
    position = position & (net_value > 10)
    position = position.rolling(25).sum().fillna(0)
    position = position * (-1)
    
    report = sim(position, trade_at_price="close", fee_ratio=1.425/1000*2)
```

![image 17](https://www.finlab.tw/wp-content/uploads/2023/09/image-17.png "事件交易：現金增資放空 3")

### 結論
==

經過對現金增資策略以及相關因素的深入分析，我們可以得出以下結論：

1.  **現金增資策略的觀察**：本文提到了一種策略稱為「大現增快繳款結束」，這策略與現金增資放空策略有一定的相關性，特別是在增資結束後，股價表現長期下跌的情況。這引發了對增資策略的重新思考，並呼籲讀者以不同的角度來看待這種策略。
2.  **現金增資的基本知識**：我們提供了有關現金增資的基本知識，包括增資的目的、方式、認股價格、對股價的影響以及投資決策的考慮因素。這有助於投資者更好地理解這種公司行為的背後動機和可能的影響。
3.  **相關因子分析**：我們採用了橫斷面回歸分析，評估了不同因素對增資事件後的股價異常報酬率的影響。特別是，我們觀察到增資規模（X4）對股價表現有顯著影響，即越大的現金增資可能導致股價下跌。
4.  **交易策略**：最後，我們提供了一個以全空頭策略為基礎的交易策略，這策略在過去的歷史數據中表現良好。它利用了alpha投資和負beta成分，並通過結合多頭策略來有效地管理避險。

總之，這份文章旨在幫助讀者更深入地了解現金增資策略及其可能的影響因素，同時提供了一個具體的交易策略示例。然而，投資涉及風險，讀者應謹慎評估任何投資決策，並根據個人風險承受能力和目標制定相應的策略。

### 事件交易分析法：減資事件是我的印鈔機
==================

*   Post author:[lawrence](https://www.finlab.tw/author/lawrence/ "「lawrence」的文章")
*   Post published:2023-09-20
*   Reading time:5 mins read

**內容目錄** [隱藏](#)

[1 彌補減資後容易下跌](#mi_bu_jian_zi_hou_rong_yi_xia_die)

[2 這篇文章能帶給我什麼收穫？](#zhe_pian_wen_zhang_neng_dai_gei_wo_shen_me_shou_huo)

[3 簡介減資](#jian_jie_jian_zi)

[4 回測與統計](#hui_ce_yu_tong_ji)

[4.1 簡介事件研究法](#jian_jie_shi_jian_yan_jiu_fa)

[4.2 這隻策略大概有多好？– 敘述性統計](#zhe_zhi_ce_lue_da_gai_you_duo_hao-_xu_shu_xing_tong_ji)

[4.3 什麼因子可能影響績效？– 橫斷面回歸分析](#shen_me_yin_zi_ke_neng_ying_xiang_ji_xiao-_heng_duan_mian_hui_gui_fen_xi)

[5 交易策略](#jiao_yi_ce_lue)

[6 結論](#jie_lun)

### 彌補減資後容易下跌
=========

要是在彌補虧損減資結束的當下開始放空同欣電，只要一個月的時間，每張就能獲利 40,000 元，這已經比一般上班族每個月的薪水還多了。這麼好的機會，怎麼能不好好把握呢？

![image 3](https://www.finlab.tw/wp-content/uploads/2023/09/image-3-521x1024.png "事件交易分析法：減資事件是我的印鈔機 1")

當一支股票辦理彌補虧損減資後，股價常常隨著下跌，要是能放空這些股票，就能取得許多利潤。

### 這篇文章能帶給我什麼收穫？
=============

這篇內容為讀者提供了有關股票減資和彌補虧損減資事件研究法的深入了解，以及如何利用統計分析來評估這些事件對股票市場的影響。這些內容能帶給讀者以下收穫：

1.  **了解股票減資的不同形式：** 文章解釋了現金減資和彌補虧損減資兩種不同形式的減資，幫助讀者理解這些概念以及它們如何影響公司和股東。
2.  **認識事件研究法：** 文章介紹了事件研究法，這是一種用於評估特定事件對股票市場的影響的方法。讀者可以學習如何使用這種方法來分析股票市場的變化。
3.  **理解異常報酬和累積異常報酬：** 文章解釋了異常報酬和累積異常報酬的概念，這些是事件研究法中的重要指標，用於評估股票價格在事件發生後的波動。
4.  **應用統計分析：** 透過回歸分析和統計工具，讀者可以了解事件研究法如何使用數據來評估事件對市場的影響，以及這些影響是否具有統計學上的意義。
5.  **研究績效影響因素：** 本文提供了一些可能影響股票減資事件績效的因素，例如周轉率和成交量，這些因素可以幫助讀者更深入地分析股票市場。
6.  **交易策略示例：** 文章提供了一個減資事件相關的交易策略示例，讓讀者了解如何應用事件研究法的結果來制定投資策略。

### 簡介減資
====

減資是指公司減少資本額，導致流通在外股數減少，但股價可能上升，整體市值保持不變。股票分割和減資不同，股票分割只改變股價和股數，不影響股東權益結構。減資主要有三原因：彌補虧損、回購股票、發還多餘現金給股東。減資方式包括直接註銷股票、庫藏股減資、現金減資。不同情況下，公司選擇不同方式。減資影響股東權益、公司財務狀況和股價，但整體市值不變。庫藏股減資不調整股價，但可能帶動股價上漲。減資的影響應視公司情況而定。

關於減資更詳細的解釋，可以看看[市場先生](https://rich01.com/what-is-capital-reduction-0/)的解釋。

### 回測與統計
=====

這一段對多數讀者來說可能很無聊，如果懶得看的話，可以直接跳到下一章就好

簡介事件研究法
-------

事件研究法（Event Study）是一種金融和經濟學領域常用的研究方法，它用於評估某個特定事件對股票市場或資本市場的影響。這個方法的核心目標是分析事件發生後股票或資產價格的變化，以評估這些事件對市場的影響。

以下是事件研究法的一些重要概念和步驟：

1.  事件：事件可以是各種不同的情況，例如公司宣布盈利報告、政府政策改變、重大合併收購、自然災害等。研究者必須確定事件的精確日期和內容。
2.  窗口期（Event Window）：事件研究法通常會選擇一個特定的時間窗口，該窗口通常包括事件前後的幾天或幾個交易日。這個窗口用於觀察事件對股票或資產價格的影響。
3.  投資組合：研究者會建立一個代表市場的投資組合，以便比較該組合在事件窗口期內的表現與事件相關股票或資產的表現。
4.  收益率計算：研究者會計算在事件窗口期內股票或資產的日度或周度收益率，以確定它們是否在事件發生後出現異常的價格波動。
5.  異常收益率（Abnormal Returns）：異常收益率是指股票或資產的實際收益率減去預期收益率的差額。預期收益率通常是通過使用市場模型或資本資產定價模型（CAPM）來計算的。
6.  統計分析：研究者使用統計方法來評估異常收益率是否在統計上顯著，這通常涉及到假設檢驗和t檢驗等統計工具。
7.  結論：基於統計分析的結果，研究者可以得出關於事件對市場影響的結論。如果異常收益率是統計上顯著的，則可以認為事件對市場有影響。

CAAR（Cumulative Abnormal Returns）是事件研究法中的一個關鍵概念，它代表累積異常報酬。異常報酬是指實際報酬減去預期報酬，而CAAR則是在事件窗口期間的異常報酬的總和。事件窗口期通常包括事件前期、事件日和事件後期，以便觀察市場對事件的反應。CAAR提供了一個時間序列的視角，顯示了事件對市場價格的累積影響。

AAR（Average Abnormal Returns）是CAAR的計算基礎，它代表平均異常報酬。AAR計算方法是，在事件窗口期間計算每個日期的異常報酬，然後取這些異常報酬的平均值。AAR可用於評估事件日前後單個日期的市場反應。

事件研究法在金融學、經濟學和企業管理等領域中廣泛應用，它可以幫助研究者評估事件對市場參與者行為和市場效率的影響，並提供有價值的洞察和決策支持。這種方法也常被用於評估投資組合的風險和回報，以及制定投資策略。

未來可能會再跟各位讀者分享事件交易的技巧，敬請各位期待 ![😀](https://s.w.org/images/core/emoji/14.0.0/svg/1f600.svg)

這隻策略大概有多好？– 敘述性統計
-----------------

首先，我們將所有樣本拆成四組，分別是現金減資、彌補虧損減資，還有上市股票、上櫃股票。

![jVCo7WU M9G2zyyYyJw9AbrnGwwGteKRlZ8BD2jHzS2 EQRu5nqjtobN4Js8lcG6n6zRd3L9V GO90jG6OhxXDRaSDlK fWLJxi3X4H8gkgKC80Nkx1wFURu ScFvI3KtTQpLnfnazDcCdRMYu6](https://lh3.googleusercontent.com/jVCo7WU-M9G2zyyYyJw9AbrnGwwGteKRlZ8BD2jHzS2-EQRu5nqjtobN4Js8lcG6n6zRd3L9V_GO90jG6OhxXDRaSDlK_fWLJxi3X4H8gkgKC80Nkx1wFURu-ScFvI3KtTQpLnfnazDcCdRMYu6-Sx8 "事件交易分析法：減資事件是我的印鈔機 2")

![qXNIuJajou O D0nYVxMQFcMlu2bkJtLvmSAIJo2XWfihoTLWsehCeKYSkCgAK1KLuUZl9UszaBwCCRC4av ooPs h FQIa6Kjtvf4ALkqgG cQzVfzh jSq2 DRo9H ptHibASCAfiQnN 3WCimRkA](https://lh4.googleusercontent.com/qXNIuJajou_O-D0nYVxMQFcMlu2bkJtLvmSAIJo2XWfihoTLWsehCeKYSkCgAK1KLuUZl9UszaBwCCRC4av-ooPs_h_FQIa6Kjtvf4ALkqgG_cQzVfzh-jSq2_DRo9H-ptHibASCAfiQnN_3WCimRkA "事件交易分析法：減資事件是我的印鈔機 3")

由上述兩個樣本，可以觀察到彌補虧損減資跌的比較多。

![XXOfIjPtipVzEppo fmArg1GEKf4MubCKfRbvCnoMLCIZB MYho 53WvkU8Alsu4AkqLLRGCaFhkSydQlXxLBN3r6 QBLBWyRct7M 7DY3HBQmB 1pcDfkc7 SZaHSLu6MwrtUSzis1GAEPqjnIUmQ](https://lh3.googleusercontent.com/XXOfIjPtipVzEppo-fmArg1GEKf4MubCKfRbvCnoMLCIZB_MYho__53WvkU8Alsu4AkqLLRGCaFhkSydQlXxLBN3r6_QBLBWyRct7M_7DY3HBQmB-1pcDfkc7_SZaHSLu6MwrtUSzis1GAEPqjnIUmQ "事件交易分析法：減資事件是我的印鈔機 4")

![zqgDnX2G7MIUYoK1BDrFxkZVlvuEvYslqgP3jf JUQXl5eqtiZuFeE BT5Gqo7O6e9L9JU8p Ws3217JzZM2GYgs623Pe teVNFD1zbzXOZD23W5q02Ctn6ukn1hyi](https://lh5.googleusercontent.com/zqgDnX2G7MIUYoK1BDrFxkZVlvuEvYslqgP3jf-JUQXl5eqtiZuFeE-BT5Gqo7O6e9L9JU8p_Ws3217JzZM2GYgs623Pe_teVNFD1zbzXOZD23W5q02Ctn6ukn1hyi-xsbDB3uAOdWIDXYqsZYo7828 "事件交易分析法：減資事件是我的印鈔機 5")

然而，值得注意的是，上櫃股票在減資後股價卻呈現上升的現象，這或許是由於在 FinLab 資料庫中，上櫃股票執行減資的次數相對較少。相對地，上市股票執行減資的次數較多。這種情況可能暗示，上櫃股票表現較為正面的結果可能只是由於樣本數不足的緣故，而非真正的趨勢。

什麼因子可能影響績效？– 橫斷面回歸分析
--------------------

以下是各種因子和相關的回歸結果，用於分析績效的可能影響因素：

*   Y: 從減資日開始，到減資後五天的累積異常報酬率
*   X1: 減資前二十日累積周轉率
*   X2: 減資前十日累積周轉率
*   X3: 減資前五日累積周轉率
*   X4: 減資前一日成交量 / 過去前二十日成交量
*   X5: 減資前一日成交量 / 過去前五日成交量
*   X6: 減資前累積二十日報酬率

![image 4](https://www.finlab.tw/wp-content/uploads/2023/09/image-4.png "事件交易分析法：減資事件是我的印鈔機 6")

TSE – Cash Reduction Regression Results

![image 5](https://www.finlab.tw/wp-content/uploads/2023/09/image-5.png "事件交易分析法：減資事件是我的印鈔機 7")

TSE – Deficit Reduction Regression Results

有鑑於上櫃股票的樣本數量並不充足，於是在此先略過上櫃股票的回歸數據。

上述資料呈現了上市股票進行現金減資和彌補虧損減資後的回歸結果。這些統計結果為我們提供了分析績效影響因素的基礎。如何運用這些結果來改進策略，就請讀者們發揮創意吧！

### 交易策略
====

```
    from pandas.core.indexing import convert_from_missing_indexer_tuple
    from finlab import data
    from finlab.backtest import sim
    import pandas as pd
    
    import datetime
    
    close = data.get("price:收盤價")
    daily_dates = pd.Series(close.index)
    
    def deficit_reduction(tag):
      reduction_date = data.get(f'{tag}:恢復買賣日期')
      reduction_reason = data.get(f'{tag}:減資原因')
    
      # FinLab.DataFrame would automatically fill True after the extension. However, our
      # goal is to fill the gaps with False. Therefore, only accept the signal on the rising edge.
      position = (reduction_date.notna()) & (close >= 0) # The extension
      position = (position.shift(-1).fillna(False)) & (~position) # Rising edge
    
      # Filters & Conditions
      positon = position & (reduction_reason == "現金減資")
      position = position.rolling(5).sum().fillna(0) > 0
      return position
    
    position = deficit_reduction("capital_reduction_tse")
    position = position * (-1)
    
    new_report = sim(position, trade_at_price="close", fee_ratio=1.425/1000/3, stop_loss=0.3)
```

![image 6](https://www.finlab.tw/wp-content/uploads/2023/09/image-6.png "事件交易分析法：減資事件是我的印鈔機 8")

### 結論
==

這篇文章探討了上市股票在進行現金減資和彌補虧損減資後的回歸結果，以及分析了可能影響績效的因素。從回歸分析中我們可以看到，在不同情況下，股票的表現存在顯著差異。彌補虧損減資後，股價普遍下跌，這為投資者提供了一些放空的機會。然而，需要謹慎處理，因為市場反應也可能受到其他因素的影響。

另外，我們也進行了橫斷面回歸分析，試圖找出可能影響績效的因素，包括周轉率、成交量和報酬率等。這些分析結果可以作為投資策略的參考，幫助投資者更好地理解市場行為。


## 事件研究法上：找到異常報酬率

**內容目錄** [隱藏](#)

[1 什麼是事件研究法？](#shen_me_shi_shi_jian_yan_jiu_fa)

[2 事件研究法能做什麼？](#shi_jian_yan_jiu_fa_neng_zuo_shen_me)

[3 第一步：移除已知的干擾資訊](#di_yi_bu_yi_chu_yi_zhi_de_gan_rao_zi_xun)

[3.1 異常報酬率](#yi_chang_bao_chou_lu)

[4 第二步：研究股價的反應特性](#di_er_bu_yan_jiu_gu_jia_de_fan_ying_te_xing)

[5 以減資研究為例](#yi_jian_zi_yan_jiu_wei_li)

[5.1 第一步：移除已知的干擾資訊](#di_yi_bu_yi_chu_yi_zhi_de_gan_rao_zi_xun1)

[5.2 第二步：研究股價的反應特性](#di_er_bu_yan_jiu_gu_jia_de_fan_ying_te_xing1)

[6 結論](#jie_lun)

[7 References](#References)

### 什麼是事件研究法？
=========

在探討事件研究法之前，想像一下，市場突然來了個大新聞，比如說美國聯準會突然宣布三個月後要升息1%。這時候，我們就會有幾個癥結問題需要解答：

1.  股價是在公告一出來就跌，還是等到真正升息了才開始反應？
2.  是整個市場一起跌，還是說某些股票因為對利率特別敏感，所以才會跌？
3.  如果有的股票在升息公告之前就已經在跌了，那麼這波跌勢是不是真的跟升息有關，還是因為市場的動能或者其他因素？

事件研究法就是來幫忙回答這些問題的。它通常包含三個關鍵步驟：

1.  去除那些像是大盤趨勢這類已知會影響的因素；
2.  研究股價對事件的反應特性，看看是在消息公佈的時候反應，還是在事情真的發生的時候；
3.  分析股價下跌的原因，看看到底是市場動能在作怪，還是政策改變的緣故。

簡單來說，事件研究法就是在告訴我們「那些突如其來的大事對市場有什麼影響」。

### 事件研究法能做什麼？
==========

使用事件研究法不見得能讓你一夜致富，但絕對可以幫你深入了解市場的運作。對市場的深入理解，有助於你找到賺錢的機會。

而且，事件研究法的應用可不只在股市。在許多科學研究的領域裡頭，這個方法都很實用。無論是評估藥物對血糖控制的效果，還是看看早戀會不會對學業成績造成影響，都能用上這個方法。

拿早戀影響學業的研究來說吧，我們會進行以下步驟：

1.  排除那些已知的干擾，例如全班因為出了太難的題目而不及格。
2.  研究成績的反應特性，就是看看是不是在告白之後，第二天的小考成績就直接掉榜了，還是成績會慢慢地下滑？
3.  分析成績下降的原因，是不是因為戀愛花太多時間，還是因為早戀會影響到思考能力，導致腦袋變得不好使？

### 第一步：移除已知的干擾資訊
=============

第一步當然是要把那些雜訊去除掉。我們想專注在個別股票上的表現，不想被整體市場的動態給影響。CAPM模型就是這種分析的一個工具，它透過線性迴歸計算出beta值，然後用這個值來預測股價。詳細可以去看 [Investopedia 的介紹](https://www.investopedia.com/ask/answers/071415/what-formula-calculating-capital-asset-pricing-model-capm-excel.asp)。

![image 10](https://www.finlab.tw/wp-content/uploads/2023/09/image-10.png "事件研究法上：找到異常報酬率 1")

異常報酬率
-----

異常報酬率其實就是實際報酬和預期報酬之間的差異。這個數據可以幫我們剔除市場整體的影響，專注分析個股。

![image 12](https://www.finlab.tw/wp-content/uploads/2023/09/image-12.png "事件研究法上：找到異常報酬率 2")

### 第二步：研究股價的反應特性
=============

下圖的縱軸是累積平均異常報酬率，橫軸是日期，通常第零天是事件發生日。

![image 13](https://www.finlab.tw/wp-content/uploads/2023/09/image-13-1024x354.png "事件研究法上：找到異常報酬率 3")

只要做出這張圖，就能一目了然股價的反應特性了。從左圖可以得知，FDA Approval 後股價會立刻反應完，甚至還有一點過度反應的跡象；從右圖可以得知 Special Dividend 有反應不足的跡象。

### 以減資研究為例
=======

讓我們回顧之前的文章，[減資策略](https://www.finlab.tw/capital-reduction-short/)。讓我們以減資研究為例，執行第一步跟第二步。

第一步：移除已知的干擾資訊
-------------

只要把大盤的報酬率，還有個股的報酬率，餵給 Linear Regression 後，再計算估計值跟實際值的差，就能算出 Residuals，也就是異常報酬率了。

![image 15](https://www.finlab.tw/wp-content/uploads/2023/09/image-15.png "事件研究法上：找到異常報酬率 4")

![image 14](https://www.finlab.tw/wp-content/uploads/2023/09/image-14.png "事件研究法上：找到異常報酬率 5")

完整實作可以參考[別人的 package & implementation](https://github.com/LemaireJean-Baptiste/eventstudy/blob/master/eventstudy/models.py)。

第二步：研究股價的反應特性
-------------

下圖為平均異常報酬率 (AAR) 與累積平均異常報酬率 (CAAR)。

![qXNIuJajou O D0nYVxMQFcMlu2bkJtLvmSAIJo2XWfihoTLWsehCeKYSkCgAK1KLuUZl9UszaBwCCRC4av ooPs h FQIa6Kjtvf4ALkqgG cQzVfzh jSq2 DRo9H ptHibASCAfiQnN 3WCimRkA](https://lh4.googleusercontent.com/qXNIuJajou_O-D0nYVxMQFcMlu2bkJtLvmSAIJo2XWfihoTLWsehCeKYSkCgAK1KLuUZl9UszaBwCCRC4av-ooPs_h_FQIa6Kjtvf4ALkqgG_cQzVfzh-jSq2_DRo9H-ptHibASCAfiQnN_3WCimRkA "事件研究法上：找到異常報酬率 6")

可以觀察到在彌補虧損減資前幾天股價就開始下跌了，並且一路跌到彌補虧損減資後五天。在接下來的系列中，我們將會教你來一起研究事件交易法，將 finlab package 中的隱藏功能給解鎖！！！

### 結論
==

在本文中，我們探討了事件研究法及其應用。事件研究法是一種重要的研究方法，用於分析突然發生的事件如何影響市場或其他現象。這種方法可以幫助我們回答重要的問題，如股價下跌的原因，是否因市場整體波動或特定因素引起，以及股價反應的時間特性等。

事件研究法的關鍵步驟包括移除已知的干擾因素，研究股價的反應特性，以及分析事件引起的原因。這些步驟幫助我們深入了解事件的影響，並排除了外部因素的干擾，使我們能夠更準確地評估事件對市場或其他現象的影響。

此外，事件研究法不僅適用於金融市場，還廣泛應用於各種科學研究領域。它可以幫助研究人員評估不同事件對各種現象的影響，從藥物效果到學術成績，都可以應用類似的原則進行研究。

最後，不妨在你身邊找看看事件研究法的題材，像是

1.  金紙銷量與清明節的關係
2.  酒精攝取量與分手的關係
3.  血糖與吃飯的關係

也許這些事情跟交易無關，但也都是可以用事件研究法來探討的題材喔！

### References
==========

[https://www.eventstudytools.com/introduction-event-study-methodology](https://www.eventstudytools.com/introduction-event-study-methodology)

[https://www.investopedia.com/ask/answers/071415/what-formula-calculating-capital-asset-pricing-model-capm-excel.asp](https://www.investopedia.com/ask/answers/071415/what-formula-calculating-capital-asset-pricing-model-capm-excel.asp)

[https://medium.com/mlearning-ai/the-capital-asset-pricing-model-capm-financial-analysis-in-python-1a7a4f2c7650](https://medium.com/mlearning-ai/the-capital-asset-pricing-model-capm-financial-analysis-in-python-1a7a4f2c7650)


## 事件研究法（中）使用事件交易模組
================

*   Post author:[lawrence](https://www.finlab.tw/author/lawrence/ "「lawrence」的文章")
*   Post published:2023-10-31
*   Reading time:6 mins read

當台灣的上市公司宣布有關股票的特別消息，比如說要分紅或者調整股票的價值（這種情況我們稱之為除權或除息），這通常會對公司的股票價格造成一些波動。我們的研究就是要搞清楚，這些宣布到底對股票價格有什麼影響。

這篇文章中，我們將介紹 finlab package 嶄新超好用的工具，讓你一秒判斷除權息究竟要做多還是做空？首先，我們會從財務的大數據庫裡面搜集這些宣布的具體信息，包括宣布的時間、具體的生效日和股票的交易變動。這樣我們就能知道哪天發生了什麼事。

接下來，我們會整理這些信息，把它們按照時間和股票代號排列好，這個過程就像是把一堆散亂的資料整理成清晰的列表。

然後我們用一種叫做事件研究的方法，來計算這些特別宣布前後，股票的價格變動情況。我們會比較這個變動和一般市場的變動有什麼不同，從而評估這個宣布的影響力度。

簡而言之，我們的研究就是想要了解，當公司發出某些股票相關的重要消息時，投資人的反應是怎樣的，並且這對股票價格會有什麼樣的效果。

**內容目錄** [隱藏](#)

[1 查看事件前後的異常報酬率](#cha_kan_shi_jian_qian_hou_de_yi_chang_bao_chou_lu)

[2 拿取財務資料](#na_qu_cai_wu_zi_liao)

[3 研究異常報酬率與各種因子的相關性](#yan_jiu_yi_chang_bao_chou_lu_yu_ge_zhong_yin_zi_de_xiang_guan_xing)

[4 結論](#jie_lun)

### 查看事件前後的異常報酬率
============

我們將用簡單的 Python 語法來分析：

1.  從財務數據庫中提取除權息公告數據。
2.  清洗和轉換數據，創建事件矩陣。
3.  進行事件研究，計算異常收益率。
4.  將結果以視覺化的方式呈現，分析事件對股價的影響。

只需要簡單的幾行，就能知道事件前後的異常報酬率了。舉例而言，如果想知道除權前後的異常報酬率，只需要執行下面的程式碼，就能輸出圖表了。

### 拿取財務資料
======

想像一下，你是一位探險家，你手中有一張藏寶圖，這張圖上標記著一系列的「X」，代表著可能埋藏著寶藏的地點。在這個比喻中，寶藏就是一個公司特定財務事件（如除權除息）對股票價格的潛在影響，而你要做的，就是跟隨這張地圖去探索這些「X」標記處是否真的有寶藏。

在我們的情境中，「X」標記是數據中的除權除息事件。我們的目標是要找出這些事件是否對股票價格造成了影響。

首先，我們利用一個像是魔法箱子的工具 —— finlab 數據庫，這個數據庫像是藏寶圖的起點。我們叫它出來（用一行程式碼），讓它顯示出最近的幾個「X」（也就是公司的除權除息事件）。

```
    from finlab import data
    
    data.get('dividend_announcement').head()
```

![image 10](https://www.finlab.tw/wp-content/uploads/2023/11/image-10-1024x491.png "事件研究法（中）使用事件交易模組 1")

*   從 `finlab` 庫導入 `data` 模組。
*   調用 `get` 函數來檢索 `dividend_announcement` 數據集，這是一個包含公司除權息公告的數據集。
*   顯示了包含多個欄位的 DataFrame，這些欄位包括股票代號、公告日期、基準日期、公司名稱、所屬期間、增資配股等信息。

然後，我們要確保我們的地圖是乾淨的，沒有重複的標記，也沒有模糊不清的部分（這就是去重和去除空值的程式碼部分）。我們還會重新繪製地圖，讓每個「X」都按照日期排好（轉換成一個新的表格）。

```
    from finlab import data
    
    event = data.get('dividend_announcement')\
        .drop_duplicates(subset=['stock_id', '除權交易日'])\
        .dropna(subset=['stock_id', '除權交易日'])\
        .pivot(index='除權交易日', columns='stock_id', values='市場別')\
        .rename_axis('date')\
        .notna()
    
    event.head()
```

*   這段程式碼進一步處理上述提取的數據。
*   `.drop_duplicates()` 移除重複的行。
*   `.dropna()` 刪除含有空值的行。
*   `.pivot()` 將數據重塑成一個以除權交易日為索引，股票代號為欄位的新 DataFrame。
*   `.rename_axis('date')` 更改索引名稱為 `date`。
*   `.notna()` 將所有的 NaN 值轉換為布林值 False。

![image 11](https://www.finlab.tw/wp-content/uploads/2023/11/image-11.png "事件研究法（中）使用事件交易模組 2")

這樣就可以產生一張表格，True，對應到就是除權的股票和日期，我們可以用簡易的程式來驗證，來看除權息通常都是每年的夏天發生：

    event.sum(axis=1).plot()

![image 12](https://www.finlab.tw/wp-content/uploads/2023/11/image-12.png "事件研究法（中）使用事件交易模組 3")

接下來我們可以透過很方便的函數來產生除權息後的五日、十日、二十日、六十日以後的報酬率：

    from finlab.tools.event_study import create_factor_data
    
    adj_close = data.get('etl:adj_close')
    factor_data = create_factor_data(event, adj_close, event=event)
    
    factor_data

![image 13](https://www.finlab.tw/wp-content/uploads/2023/11/image-13.png "事件研究法（中）使用事件交易模組 4")

但如此還是有點不清楚，有沒有方法能來統計呢？接下來我們可以透過 event\_study 來視覺化事件發生後的報酬率：

    from finlab.tools import event_study
    
    benchmark = data.get('benchmark_return:發行量加權股價報酬指數')
    
    r = event_study.event_study(factor_data, benchmark, adj_close.ffill())
    
    r.head()

![image 14](https://www.finlab.tw/wp-content/uploads/2023/11/image-14-1024x191.png "事件研究法（中）使用事件交易模組 5")

這樣就產生出一張表格，其中 y 軸是每一次除權息，x 軸是除權息的前後幾天的報酬率。我們可以用簡易的方式來將報酬率繪製出來：

    r.mul(100).mean().plot.bar(use_index=False)
    ax = r.mean().mul(100).cumsum().plot(use_index=False)

![image 16](https://www.finlab.tw/wp-content/uploads/2023/11/image-16.png "事件研究法（中）使用事件交易模組 6")

Y軸是報酬百分比，X軸是天，第零天為事件發生日。直調圖為扣除大盤的報酬率，線段為累計報酬率。

Y軸是報酬百分比，X軸是天，第零天為事件發生日。直條圖為扣除大盤的報酬率，線段為累計報酬率。

執行完上面的程式後，就能把數據視覺化呈現出來，運用起來相當方便。更甚者，FinLab 已經提供完整的資料集了，不用自己再用爬蟲去慢慢爬資料了！

### 研究異常報酬率與各種因子的相關性
================

故事到這裡就結束了，不過我們想要再來延伸應用，假如低價股或獲利不好的股票在除權息時，究竟表現會不會更差呢？只要簡單的幾行，就能輸出各項因子與異常報酬率之間的關係。我們可以用以下的方法來研究：

```
    import statsmodels.api as sm
    import numpy as np
    
    
    factor_data = create_factor_data({
        'pb': data.get('price_earning_ratio:股價淨值比'),
        'pe': data.get('price_earning_ratio:本益比'),
        }, adj_close, event=event)
    
    res = sm.OLS(factor_data['10D'], sm.add_constant(factor_data[['pb_factor', 'pe_factor']])).fit()
    print(res.summary())
```

![image 17](https://www.finlab.tw/wp-content/uploads/2023/11/image-17.png "事件研究法（中）使用事件交易模組 7")

輸出結果如下，可以看到 statsmodel 提供的一份回歸結果：

1.  **Dep. Variable (因變量)**: `10D` 代表我們模型的預測目標，可能是指在某事件後的10天內的股票收益率。
2.  **Model (模型)**: `OLS` 這表示我們使用的是普通最小二乘法(Ordinary Least Squares)進行線性回歸分析。
3.  **Method (方法)**: `Least Squares` 這意味著這是一種嘗試最小化誤差平方和的方法。
4.  **R-squared (決定係數)**: `0.000` 這個數值告訴我們模型擬合的好壞，數值範圍是0到1。接近1意味著模型能夠很好地解釋因變量的變異。在這裡接近0，意味著模型解釋力很低。這只是範例啦～不要翻白眼XDD。
5.  **Adj. R-squared (調整決定係數)**: `-0.000` 考慮到自變量的數量，這是對決定係數的一個調整。同樣的，這裡也顯示模型的解釋力很低。
6.  **F-statistic (F統計量)**: `0.8271` 這個數值用來檢測模型的整體顯著性。一個高的F統計值暗示至少有一個預測變量對因變量有顯著影響。
7.  **Prob (F-statistic) (F統計量的概率值)**: `0.437` 這是觀察到至少這麼大F統計量的概率，通常用來判斷模型的整體顯著性。通常p值小於0.05被認為是統計上顯著的。可見當前的數值，並沒有顯著的特性。
8.  **Log-Likelihood (對數似然比)**: `3426.5` 這個數值越大，表示模型越好。
9.  **AIC (赤池信息準則)** 和 **BIC (貝葉斯信息準則)**: 這兩個值越低，表示模型越好。它們是懲罰項，用於調整模型中預測變量的數量，防止過度擬合。
10.  **Df Residuals (殘差自由度)** 和 **Df Model (模型自由度)**: 分別表示殘差和模型的自由度。自由度是指在計算統計量時，數據中獨立信息的數量。
11.  **Covariance Type (共變異數類型)**: 這告訴我們計算共變異數（即參數估計的不確定性）的方法。

### 結論
==

經過上述的探討，我們對事件交易有了更深入的理解。透過觀察事件前後的異常報酬率，以及研究異常報酬率與各種因子的相關性，我們能更精確地預測和評估投資策略的效果。

而 FinLab 的最新事件交易模組正好提供了一個完善的工具來進行這樣的分析。隨著技術的不斷進步，FinLab 未來將會推出更多別出心裁、有助於投資者的研究。讓我們一同期待，並不斷探索金融市場的無限可能！


## 揭秘庫藏股：智慧投資策略與市場動態的完美結合



*   Post author:[lawrence](https://www.finlab.tw/author/lawrence/ "「lawrence」的文章")
*   Post published:2023-12-31
*   Reading time:4 mins read

本文介紹什麼是庫藏股，並且以淺顯易懂的方式進行解說，並且實作年化報酬率20％以上的庫藏股策略，歡迎大家觀摩學習，推廣 FinLab。

![80p1vnct](https://www.finlab.tw/wp-content/uploads/2023/11/80p1vnct-1024x585.png "揭秘庫藏股：智慧投資策略與市場動態的完美結合（Part 1） 1")

庫藏股如何獲利？

**內容目錄** [隱藏](#)

[1 庫藏股是什麼？](#ku_cang_gu_shi_shen_me)

[2 為什麼需要庫藏股](#wei_shen_me_xu_yao_ku_cang_gu)

[3 怎麼利用庫藏股事件獲利](#zen_me_li_yong_ku_cang_gu_shi_jian_huo_li)

[4 結論](#jie_lun)

[5 用程式自動下單](#yong_cheng_shi_zi_dong_xia_dan)

庫藏股是什麼？
-------

庫藏股，是指公司購回自家股票並暫時保留而未注銷的一種股票形式。這類股票一旦被公司回購，就不會參與流通，因此不具備投票權和股利資格。企業進行庫藏股操作的目的多樣，其中包括增加每股價值、作為防禦敵意收購的策略、提供員工激勵計劃的選項，以及優化財務報表。這一策略在全球多數國家和地區的股市中普遍存在。

當公司決定購回股票後，這些股票可以保留為庫藏股，也可選擇注銷。注銷後，公司的股本會相應減少，從而提升每股盈利（EPS）。庫藏股的策略不僅有助於改善關鍵財務指標，如EPS，也能對股票市場的整體表現產生積極影響。台灣股市中的庫藏股操作，同時也涉及到稅務考量，相比於現金分紅，庫藏股具有稅務上的優勢。

更多詳細資訊，歡迎參考[市場先生](https://rich01.com/blog-pos-24/)的深入解析。

為什麼需要庫藏股
--------

庫藏股的存在和使用通常基於以下幾個主要原因：

1.  增加股價和每股盈利（EPS）：通過減少流通中的股份數量，公司可以提升剩餘股份的價值和每股盈利（EPS）。這是因為在盈利不變的情況下，減少的股份數量意味著每股分攤到的盈利增加。
2.  防禦策略：當公司面臨敵意收購的威脅時，購買庫藏股可以作為一種防禦策略。透過減少市場上可用的股份，公司可以提高敵對方收購所需的成本，從而降低被收購的風險。
3.  資本結構最優化：公司可能認為股票被低估，因此透過買回股票來改善其資本結構，同時向市場傳達對自身價值的信心。
4.  員工激勵計劃：庫藏股可用於員工股票選擇權計劃或其他形式的員工報酬計劃。這有助於增強員工對公司的忠誠度和激勵，因為他們直接參與到公司的表現中。
5.  資本回報：當公司擁有多餘現金且缺乏其他高回報的投資機會時，它可能選擇透過庫藏股回報給股東。這可以視為對股東的一種獎勵。
6.  稅務考量：以台股為例，庫藏股相比於現金分紅具有稅務上的優勢。
7.  改善財務指標：減少流通中的股票數量有助於改善某些關鍵的財務指標，如每股盈利（EPS），從而對公司股票的市場表現產生正面影響。

總之，庫藏股是公司財務戰略的一部分，用於達到特定的商業目標和增強股東價值。

怎麼利用庫藏股事件獲利
-----------

探討庫藏股獲利的途徑，我們可以考慮在庫藏股操作期間實施買盤策略。這是基於一個簡單的假設：庫藏股期間往往會吸引買家進場。以下是一段以Python編寫的策略代碼，它展示了如何利用庫藏股期間的市場動態進行投資。

```
    import finlab
    from finlab import data
    from finlab.backtest import sim
    import pandas as pd
    
    close = data.get("price:收盤價")
    
    # create event dataframe
    start_buy = data.get('treasury_stock:預定買回期間-起')
    start_buy = pd.DataFrame({
      "stock_id": [stock for stock in start_buy.columns for _ in start_buy[stock].dropna()],
      "dates": [date for stock in start_buy.columns for date in start_buy[stock].dropna()]
    })
    start_buy["value"] = 1
    start_buy = start_buy.pivot(index="dates", columns="stock_id", values="value").notna()
    start_buy = start_buy.reindex(close.index, columns=close.columns).fillna(False)
    start_buy = start_buy & (~start_buy.shift(-1).fillna(False))
    
    position = start_buy
    position = position.shift(-1).rolling(40).sum().fillna(0)
    report = sim(position, trade_at_price="open", fee_ratio=1.425/1000*0.2, market='TW_STOCK')
```

雖然這種策略的效果可能有限，但它確實展示了庫藏股獲利的可能性。

![image 6](https://www.finlab.tw/wp-content/uploads/2023/12/image-6-798x1024.png "揭秘庫藏股：智慧投資策略與市場動態的完美結合（Part 1） 2")

庫藏股績效

結論
--

1.  **庫藏股定義**：庫藏股是公司購回但未注銷的自家股票。這些股票不在市場流通，無投票權和股利。
2.  **購買原因**：公司購買庫藏股可能是為了提高股價、防禦敵意收購、作為員工激勵計劃的一部分、改善財務報表等。
3.  **庫藏股的影響**：庫藏股可提升剩餘股份的價值和每股盈利（EPS），是資本結構調整的一種方式。
4.  **使用目的**：庫藏股被用於提升股價、防禦收購、員工激勵、資本回報、稅務考量、改善財務指標等。
5.  **庫藏股獲利策略**：透過特定的財務分析方法，可以在庫藏股期間進行投資操作，這可能帶來獲利機會，儘管收益可能有限。

庫藏股是公司財務策略的重要一環，用於實現多元的商業目標和增強股東價值。對於投資者來說，理解庫藏股的概念和影響，可以幫助他們做出更明智的投資決策。

接下來，我們就要將這個簡單的策略改進，獲得更穩定的報酬率。不妨來參考一下 FinLab 的 VIP 文章「[庫藏股下：讓策略變得更好](https://www.finlab.tw/inventory-down)」，裡面會更詳盡的介紹要怎麼善用庫藏股事件，下面是 VIP 策略的績效。

![image 7](https://www.finlab.tw/wp-content/uploads/2023/12/image-7-865x1024.png "揭秘庫藏股：智慧投資策略與市場動態的完美結合（Part 1） 3")

改進版的策略

用程式自動下單
-------

這個策略需要每天去看公司實施庫藏股的資料，每天去公開資訊交易站查詢，有點麻煩，為何不用我們提供的下單工具來輕鬆下單呢？其實下單的方式非常簡單，首先要在[永豐先通過 API 申請](https://sinotrade.github.io/zh_TW/tutor/prepare/open_account/)後，只需要短短幾行就可以完成：  

```
    import os
    from finlab.online.sinopac_account import SinopacAccount
    from finlab.online.order_executor import OrderExecutor, Position
    
    # 設定帳號金鑰
    os.environ['SHIOAJI_API_KEY'] = '永豐證券API_KEY'
    os.environ['SHIOAJI_SECRET_KEY'] = '永豐證券SECRET_KEY'
    os.environ['SHIOAJI_CERT_PERSON_ID']= '身份證字號'
    os.environ['SHIOAJI_CERT_PATH']= '永豐證券憑證路徑'
    os.environ['SHIOAJI_CERT_PASSWORD'] = '永豐證券憑證密碼' # 預設與身份證字號
    
    # 以 30 萬台幣計算當前帳戶應該有的股票
    fund = 300000
    target_position = Position.from_report(report, fund)
    
    # 進行下單
    acc = SinopacAccount()
    order_executor = OrderExecutor(target_position, acc)
    order_executor.create_orders()
```

只要短短幾行，程式就會幫你計算現在應該有的部位，並且進行「買賣」只需要在適當的時間（例如開盤、收盤）執行，程式就會自動下單買進賣出，將你的帳戶部位調整成獲利的形狀！再也不用自己計算每檔股票要買幾張了！非常的方便喔！

程式預設使用當前價格進行「限價單」但你也可以透過[客製化](https://doc.finlab.tw/details/order_api/)的方式，調整成「漲跌停」、「零股」、「融資券」，非常的簡單方便，讓你在股市中複製好策略的績效！


===============================

*   Post author:[lawrence](https://www.finlab.tw/author/lawrence/ "「lawrence」的文章")
*   Post published:2024-01-01
*   Reading time:4 mins read

**內容目錄** [隱藏](#)

[1 摘要](#zhai_yao)

[2 論文參考](#lun_wen_can_kao)

[3 事件交易分析法](#shi_jian_jiao_yi_fen_xi_fa)

[4 各式相關的因子](#ge_shi_xiang_guan_de_yin_zi)

[5 交易策略](#jiao_yi_ce_lue)

[6 結論](#jie_lun)

## 摘要
--

這篇文章參考了數篇論文，並採用事件分析法去研究庫藏股的超額報酬。假如還不清楚什麼是庫藏股，可以參考[上一篇](https://www.finlab.tw/inventory-up/)。

我們發現股票價格上漲主要集中在宣告初期，但到第四十天左右漲幅消失，甚至出現小幅下跌。並且，股價淨值比、過去二十天的報酬率以及流動資產占總資產比例這三項因素在統計上顯著影響了庫藏股宣告前的股票表現。

最後，我們提出一種基於庫藏股宣告的交易策略，並使用FinLab回測引擎進行模擬，該策略的模擬結果達到了年化約 30% 的報酬率。

## 論文參考
----

經過深入分析以下幾篇論文：《[庫藏股宣告效果的實證研究](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi/login?o=dnclcdr&s=id=%22094NTU05320082%22.&searchmode=basic)》、《[庫藏股買回宣告效果及其影響因素之研究](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?o=dnclcdr&s=id=%22097CYUT5304019%22.&searchmode=basic&extralimit=asc=%22%E6%9C%9D%E9%99%BD%E7%A7%91%E6%8A%80%E5%A4%A7%E5%AD%B8%22&extralimitunit=%E6%9C%9D%E9%99%BD%E7%A7%91%E6%8A%80%E5%A4%A7%E5%AD%B8)》，以及《[台灣上市公司庫藏股買回宣告對股票報酬之影響](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?o=dnclcdr&s=id=%22100YUNT5304023%22.&searchmode=basic)》，我們整理出了幾個特別有趣的因子。這些因子對於理解庫藏股的影響及其在市場上的表現尤為重要。這些因子包括：

1.  [股價淨值比](https://www.finlab.tw/pb-data-analysis-explain/)
2.  宣告前的異常報酬率
3.  公司是否屬於電子產業
4.  公司的流動現金是否充足
5.  公司的市值

這些發現提供了對庫藏股宣告及其市場反應更深入的見解。

## 事件交易分析法
-------

可以觀察到，漲幅都集中在前幾天。而且，到第四十天就沒有漲幅了，到最末尾甚至有一點跌幅。

![image](https://www.finlab.tw/wp-content/uploads/2023/11/image-1024x472.png "揭秘庫藏股：庫藏股投資策略再優化，股市條件探勘（Part 2） 1")

異常報酬率圖表

由於異常報酬率集中在庫藏股宣告的這幾天，因此後續分析都聚焦在庫藏股開始後五天。

## 各式相關的因子
-------

在我們的研究中，我們定義了以下變數並執行了線性回歸分析

*   Y：庫藏股公告前五天的報酬率
*   X1：股價淨值比
*   X2：過去二十天的報酬率
*   X3：市值
*   X4：流動資產占總資產的比例
*   X5：若屬於電子產業則為1，否則為0

在這次分析中，我們觀察到X1（股價淨值比）、X2（過去二十天的報酬率）、X4（流動資產占總資產的比例）的p-value達到了顯著水平，這表明這些因素對庫藏股宣告前的股票表現有顯著影響。具體來說，股價淨值比較低、過去二十天報酬率下降較多、以及流動資產占總資產比例較高的股票，在庫藏股宣告前五天的漲幅越大。

![image 2](https://www.finlab.tw/wp-content/uploads/2023/11/image-2.png "揭秘庫藏股：庫藏股投資策略再優化，股市條件探勘（Part 2） 2")

## 交易策略
----

值得注意的是，假設庫藏股會在 T+0 的收盤後公布，而這會使得 FinLab 的回測引擎在 T+2 的開盤買入。但實際上，在 T+1 的開盤時就能買入了，所以我們需要對 position 做 shift(-1)。

```
    import finlab
    from finlab import data
    from finlab.backtest import sim
    import pandas as pd
    
    close = data.get("price:收盤價")
    
    # create event dataframe
    start_buy = data.get('treasury_stock:預定買回期間-起')
    start_buy = pd.DataFrame({
      "stock_id": [stock for stock in start_buy.columns for _ in start_buy[stock].dropna()],
      "dates": [date for stock in start_buy.columns for date in start_buy[stock].dropna()]
    })
    start_buy["value"] = 1
    start_buy = start_buy.pivot(index="dates", columns="stock_id", values="value").notna()
    start_buy = start_buy.reindex(close.index, columns=close.columns).fillna(False)
    start_buy = start_buy & (~start_buy.shift(-1).fillna(False))
    
    pb = data.get('price_earning_ratio:股價淨值比')
    
    prev_return = close.pct_change(periods=20)
    
    liquid_asset = data.get('fundamental_features:流動資產')
    total_asset = data.get('financial_statement:資產總額')
    liquidity = (liquid_asset.ffill().bfill() / total_asset.ffill().bfill()) * (close > 0)
    liquidity = liquidity.fillna(0)
    
    position = start_buy
    position = position & (pb < 1)
    position = position.shift(-1).rolling(5).sum().fillna(0)
    report = sim(position, trade_at_price="open", fee_ratio=1.425/1000*0.2, market='TW_STOCK')
    report.display()
```

績效如下，還算不錯的一隻策略。

![image 8](https://www.finlab.tw/wp-content/uploads/2023/12/image-8-865x1024.png "揭秘庫藏股：庫藏股投資策略再優化，股市條件探勘（Part 2） 3")

## 結論
--

總結來看，庫藏股不僅是企業資本操作的重要工具，也為市場參與者提供了獨特的投資機會。通過理解庫藏股的機制和其對市場的影響，投資者可以更加有效地制定策略，並利用相關的市場動態來追求盈利。


## 脫離韭菜命運的關鍵：利用MAE分析實踐正確的停損
========================

*   Post author:[Ben](https://www.finlab.tw/author/ben/ "「Ben」的文章")
*   Post published:2023-08-17
*   Reading time:2 mins read

停損砍不下手怎麼辦？  
最近股市明顯回檔，很多人都套牢了，有人整天憂鬱地想等解套，有人心狠的砍停損，你是哪一種?  
要脫離韭菜，最重要的一步就是「停損」要砍得下手，把資金放到有希望的地方，而不是一直在絕望的深淵等待「奇蹟」，「奇蹟」之所以為奇蹟，是因為他不會一直發生，而量化交易要成功，就是高機率的事情重複做。  
如果你有做過量化，就知道交易虧損是常態，60%勝率的策略已相當不錯，但也代表仍有 40%的虧損交易是你要面對的。  
這些虧損放到長時間的策略報酬曲線，會顯示回檔只是小小的過程，重點是不要讓他變大賠！讓你可以長期待在市場享受利滾利。

**內容目錄** [隱藏](#)

[1 如何將虧損控制在可控的範圍？](#ru_he_jiang_kui_sun_kong_zhi_zai_ke_kong_de_fan_wei)

[2 歷史波動視覺化](#li_shi_bo_dong_shi_jue_hua)

[3 其他 MAE 分析要注意的重點](#qi_ta_MAE_fen_xi_yao_zhu_yi_de_zhong_dian)

[4 結論](#jie_lun)

如何將虧損控制在可控的範圍？
--------------

finlab package 針對此問題有對應的檢測法，一般的投顧老師不會跟你提，學會這招你就不用怕停損在最低點，而是停損在最關鍵位置。  
使用MAE波動分析工具: `report.display_mae_mfe_analysis()`就可以輕鬆顯示分析圖表，如果你想了解 API 的詳細功能，可見 [文檔](https://doc.finlab.tw/reference/report/#finlab.analysis.Report.display_mae_mfe_analysis) 和 [部落格相關教學](https://www.finlab.tw/display_mae_mfe_analysis/)。

歷史波動視覺化
-------

![截圖 2023 08 16 下午5.00.58](https://www.finlab.tw/wp-content/uploads/2023/08/%E6%88%AA%E5%9C%96-2023-08-16-%E4%B8%8B%E5%8D%885.00.58-1024x843.png "脫離韭菜命運的關鍵：利用MAE分析實踐正確的停損 1")

範例圖中藍色的部分是獲利的交易、紅色是虧損的交易，可以知道多數獲利的交易在持有歷程中比起虧損交易擁有較小的「最大不利方向跌幅(MAE)」。

幾乎全部獲利的交易對都不會在持有過程中面臨 -10% 的套牢窘境，換句話說，只要持有歷程的報酬率是小於 -10% ，那最終都很難翻身變成獲利的交易，繼續放反而容易有大賠風險。

而虧損交易有 25% 在持有過程中面臨 超過 -10% 的套牢窘境，也就是說若停損設在 -10%，有機會將大賠的交易有機會縮小到 -10% 左右。

總結來說，藉由這個分析圖，可以發現將停損設在 -10% 是很不錯的位置，保留獲利，提早止血，藉由統計分析，讓你知道你停損的點位是在做「正確」的事。

其他 MAE 分析要注意的重點
---------------

*   不同策略有不同波動特性，有些高報酬的策略波動大，若停損設太緊，獲利交易對容易被洗掉。
*   如果你不喜歡下檔波動，那就要降低交易對的 MAE，一個好的交易對是除了最中有獲利，持有歷程也經歷較低的下檔波動，可以用來檢測進場點的漂亮成度。
*   如果獲利交易對有很大的 MAE，可能代表策略無法明顯區分獲利與虧損交易的體質，獲利部位也容易在停損的大刀下被犧牲太多，造成停損線很難設定。

結論
--

好的策略不是只有高報酬、高夏普率，還有很多細節可以研究，你的策略擁有怎樣的 MAE 分佈圖呢？趕快來試試吧。


===================================================

## 揭開策略的波動面紗｜MAE&MFE分析圖組使用指南
=========================

*   Post author:[Ben](https://www.finlab.tw/author/ben/ "「Ben」的文章")
*   Post published:2022-02-19
*   Reading time:8 mins read

一般我們跑回測會取得報酬率曲線、最大回撤、夏普率等策略總體數值，但這些指標讓我們難以一窺策略下每筆交易的實際波動細節。交易就像跑步比賽，若只看總體數值結果，就像只看一個人跑步的結果，不看過程細節，但這些過程都是我們可以觀察、優化的階段，比如要觀察策略波動時序、勝敗手交易的波動分布是否明顯分群、策略的停損停利怎麼放比較好？藉由對波動性的分析，就不用每次都要堅持跑完煎熬的過程，可能讓我們在更佳點位出場，減少被洗掉、沒高歌離席的遺憾。

**內容目錄** [隱藏](#)

[1 如何顯示MAE&MFE分析圖組](#ru_he_xian_shiMAEMFE_fen_xi_tu_zu)

[1.1 程式範例](#cheng_shi_fan_li)

[1.2 輸出圖組範例](#shu_chu_tu_zu_fan_li)

[2 名詞定義](#ming_ci_ding_yi)

[2.1 波幅](#bo_fu)

[2.2 Edge ratio](#Edge_ratio)

[3 如何解讀圖組](#ru_he_jie_du_tu_zu)

[3.1 報酬率統計圖](#bao_chou_lu_tong_ji_tu)

[3.2 Edge Ratio 時序圖](#Edge_Ratio_shi_xu_tu)

[3.2.1 參數設定](#can_shu_she_ding)

[3.2.2 應用解釋](#ying_yong_jie_shi)

[3.3 MAE/Return 分布圖](#MAEReturn_fen_bu_tu)

[3.4 MFE/MAE 分布圖](#MFEMAE_fen_bu_tu)

[3.4.1 分佈象限圖解](#fen_bu_xiang_xian_tu_jie)

[3.5 MDD/GMFE 分布圖](#MDDGMFE_fen_bu_tu)

[3.6 MAE、ＭFE 密度分佈圖](#MAEMFE_mi_du_fen_bu_tu)

[4 Indices Stats](#Indices_Stats)

[5 結論](#jie_lun)

[6 相關學習資源](#xiang_guan_xue_xi_zi_yuan)

### 如何顯示MAE&MFE分析圖組
---------------

Finlab的[回測分析模組](https://doc.finlab.tw/reference/analysis/#finlab.analysis.Report.display_mae_mfe_analysis)可以輕鬆將`Report.get_trades(...)` 的結果帶入[Plotly.python](https://plotly.com/graphing-libraries/)做視覺化呈現。

### 程式範例

```
    from finlab import data
    from finlab.backtest import sim
    
    pb = data.get('price_earning_ratio:股價淨值比')
    close = data.get('price:收盤價')
    
    position = (1/(pb * close) * (close > close.average(60)) * (close > 5)).is_largest(20)
    report = sim(position, resample='Q',mae_mfe_window=30,mae_mfe_window_step=2)
    report.display_mae_mfe_analysis()
```

### 輸出圖組範例

![newplot 1](https://www.finlab.tw/wp-content/uploads/2022/07/newplot-1-1024x1024.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 1")

### 名詞定義
----

### 波幅

再分析接下來的圖表前，要先認識一下波幅的分類，有利於分析前建立基礎知識。

![price data](https://www.finlab.tw/wp-content/uploads/2022/02/price-data.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 2")

*   AE (adverse excursion) : 不利方向幅度，做多的話，就是下跌的波段。
*   MAE : 最大不利方向幅度，做多的話，就是持有過程中的最大累積跌幅。
*   FE (favorable excursion) : 有利方向幅度，做多的話，就是上漲的波段。
*   BMFE : MAE之前發生的最大有利方向幅度。若BMFE越高，越有可能在碰上MAE之前，先觸及停利出場 (註1)。
*   GMFE (Global MFE) : 全域最大有利方向幅度。若發生在MAE之前，則BMFE等於GMFE。若在MAE之後，則代表要先承受MAE才可能吃到較高的獲利波段。
*   MDD (Max Drawdown) : 最大回撤幅度。
*   Return : 報酬率。

### Edge ratio

![newplot 1](https://www.finlab.tw/wp-content/uploads/2022/07/newplot-1-1024x1024.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 1")

來自海龜法則 (註2) 的指標，中文稱優勢比率。  
edge ratio為平均GMFE / 平均MAE，這可以藉此評估進場優勢，一個真正隨機性的訊號大致上會帶來相等的MFE與MAE。  
若大於1，代表存在正優勢，潛在最大獲利空間比最大虧損多，在持有過程中保有優勢可以中途停利或做其他操作，也就是策略的容錯率較高。反之則為劣勢，可能要抗衡較多的虧損狀態。

### 如何解讀圖組
------

將交易分為獲利 (profit-藍點) 與虧損 (loss-紅點) 分別呈現，圖組右方的legend可以任一點選，只看profit或loss的分群呈現。接著會「由上到下、由左至右」，解釋各子圖用途。

### 報酬率統計圖

![截圖 2022 07 25 上午11.40.10](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8A%E5%8D%8811.40.10.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 4")

子圖1-1，呈現策略下每筆交易的報酬率分布，計算出勝率及平均每筆報酬。  
圖片標題為交易勝率，綠色虛線為平均每筆交易的報酬率。  
分布曲線越平坦，代表報酬率範圍大，可能有較多的極端報酬率要處理，通常出現在波動大的策略。  
若呈現右偏型態(右側的尾部更長，分布的主體集中在左側)，代表多數交易為虧損，若整體策略為獲利，則獲利為少筆交易為主要貢獻。  
若呈現左偏型態(左側的尾部更長，分布的主體集中在右側)，代表多數交易為獲利。  
若呈現鐘型曲線，代表分布較為平均。

### Edge Ratio 時序圖

![edge ratio](https://www.finlab.tw/wp-content/uploads/2022/07/edge_ratio.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 5")

子圖1-2是策略edge ratio隨進場時間 (x軸) 後的變化，可以判斷隨著持有時間推移，策略有沒有波幅操作優勢。

#### 參數設定

edge ratio的計算設定由回測函數 `[backtest.sim()](https://doc.finlab.tw/reference/sim/)` 裡的mae\_mfe\_window, mae\_mfe\_window\_step 兩個參數來控制。

*   mae\_mfe\_window : 計算mae\_mfe於進場後於不同持有天數下的數據變化，主要應用為優勢比率計算。預設為0，只會產生出場階段的mae\_mfe。
*   mae\_mfe\_window\_step : 與 mae\_mfe\_window參數做搭配，為時間間隔設定，預設為1。若mae\_mfe\_window設20，mae\_mfe\_window\_step 設定為2，相當於 python 的range(0,20,2)，以2日為間距計算mae\_mfe。

#### 應用解釋

edge ratio若一直保持在1以上，持有都具有優勢，子圖範例就是這類情況，開局就有不錯表現，明顯的谷底落在第8天後持續走高，代表可能延遲到第8天進場會有低點，之後獲利一路放大優勢。  
edge ratio時序圖走勢有很多種，若是開低走高，一開始都低於1，代表策略可能太早進場，一開始都要先承受虧損，這時可以檢討進場時機點，考慮延遲進場。

若edge ratio走勢保持在1以上，代表策略優勢明顯。若還隨著時間走高，獲利空間也上升，策略容錯率就較大，就算因一些因素延遲進場仍有較大機率有獲利範圍。  
若edge ratio走勢很常在1以下，代表策略經常被虧損壓著打，是策略負面訊號。

若隨持有時間變化，優勢漸漸流失，比率開始下降，代表MAE普遍變高，可能是策略催化劑褪色，該策略適合短線操作並考慮加上停利提早出場。  
若edge ratio走勢跳動，代表無明顯趨勢可判斷。  
若策略週期是20天，發現time\_scale大於20時，edge ratio趨勢持續走升，則透露策略可能太早出場，錯過後面更大的報酬，可以考慮修正持股週期，吃到更大的獲利。

### MAE/Return 分布圖

![截圖 2022 07 25 上午11.43.44](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8A%E5%8D%8811.43.44.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 6")

子圖1-3，x軸為報酬率，Y軸為MAE，將勝敗手分群顯示成散點圖，比對報酬率與MAE的關係。  
此範例中可以發現多數獲利的藍點都有較小的MAE，虧損的紅點有較大的MAE。  
虧損部位的MAE第75%位數為10.77%，幾乎所有的藍點都低於這個位置，也就是說過了這個位置，交易最終就容易是虧損結果，可**設為停損**參考位置，可保留多數獲利部位、減少大賠部位損失。  
獲利部位的MAE第75%位數為2.93%，代表多數獲利部位在持有過程中可能的最低點區間，碰到這位置後就有較高機率再往上，積極操作者或分批進場者可**設為攤平加碼點**位置，有機會讓獲利空間更多或賠更多。

### MFE/MAE 分布圖

![截圖 2022 07 25 下午12.00.35](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8B%E5%8D%8812.00.35-1024x412.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 7")

從子圖 2-1、2-2 可以觀察MAE與MFE的數據關係，散點圖大小由報酬率來決定。  
比對兩張圖可發現，策略內許多GMFE很大的標的，都比BMFE大，代表許多漲幅都發生在MAE之後。想要有較高獲利，就要先忍受回檔，通常這容易發生在趨勢波段策略。  
若是短線優異的策略，BMFE 會比較高，可以有較高機率在接觸MAE或停損前先做停利。

#### 分佈象限圖解

![截圖 2020 09 29 上午7.48.31](https://www.finlab.tw/wp-content/uploads/2020/09/%E6%88%AA%E5%9C%96-2020-09-29-%E4%B8%8A%E5%8D%887.48.31-1024x665.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 8")

MAE/BMFE分布圖(註3) 能幫助我們看出策略體質、優化設置停損停利。  
大原則是「分布在第二象限的點越多越好， 第四象限的點越少越好」、「獲利與虧損明顯分群在不同象限」。  
如此 stop\_loss過濾掉多數mae過大的標的，少過濾掉獲利的標的。take\_profit盡量讓多數虧損的交易先觸及停利出場。

### MDD/GMFE 分布圖

![截圖 2022 07 25 上午11.59.11](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8A%E5%8D%8811.59.11.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 9")

  
子圖2-3，判斷損益兩平點與鎖利點，橘線為45度線。  
橘線以上為MDD > GMFE，如果越多獲利點位於這個位置，代表持有歷程可能歷經大回檔吃掉獲利轉為虧損，雖然最終會是獲利，但我們原本有機會賺更多。  
  
MDD > GMFE 的情況常是一開始就吃大虧損～後來轉正，或是途中大賺後，突然急速下殺賠錢。都是比較不理想的狀況。子標題顯示的「Missed win-profits pct」為「獲利交易位於橘線上的數量/獲利交易數」，數值越高代表潛在錯失獲利的機會較高，數值越高代表越需要設定移動停利去保護獲利。  
  
橘線以下為MDD < GMFE，代表獲利的交易達到價格高點後，即使後來回檔，因回檔不會吃掉全部GMFE，所以不會轉為虧損。若是虧損的部位位於橘線以下，由於MAE <= MDD < GMFE、MAE <= Return，可以推導出即使虧損，MAE也會比GMFE小，比較高的機會是小虧出場。子標題顯示的「Breakeven safe pct」 為「橘線下的比例/全部交易數」，也就是越不容易輸的比例。

### MAE、ＭFE 密度分佈圖

![截圖 2022 07 25 下午12.40.53](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8B%E5%8D%8812.40.53-1024x276.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 10")

子圖3-1、3-2、3-3。由 [plotly-distplot](https://plotly.com/python/distplot/) 繪製而成，看指標的比例分佈曲線。  
子圖3-1為 MAE 密度分佈圖，通常策略體質若較優，勝敗手的高峰會有明顯分群，贏錢的MAE通常較小、輸錢的MAE通常較大，向右過了藍紅曲線的交叉點後，虧損的交易會變得比獲利的交易多，可以視為比較緊的停損點或是開始分批停損的參考。勝敗手Q3(第75分位數)的應用可參考MAE/Return 分布圖的說明，勝手Q3為積極者加碼點，敗手Q3為絕對停損點，再不跑就容易大賠啦！  
  
子圖 3-2、3-3 為 MFE 密度分佈圖，應用概念與子圖3-1類似。  
多數的敗手不會超過敗手MFE Q3 的位置 (圖中的5.16)，換句話說，漲過這個點後，多數交易最終會是獲利的，既然最終會是獲利的，那就會是一個不錯的突破加碼點位，若想要更高的機率確保加碼點安全性，可以用敗手MFE 大於Q3 的位置，例如藍紅曲線的交叉點。  
勝手MFE Q3 則可視為分批停利減碼點參考位置。

### Indices Stats
-------------

![截圖 2022 07 25 下午12.42.21](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8B%E5%8D%8812.42.21-1024x288.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 11")

group模式

![截圖 2022 07 25 下午1.41.57](https://www.finlab.tw/wp-content/uploads/2022/07/%E6%88%AA%E5%9C%96-2022-07-25-%E4%B8%8B%E5%8D%881.41.57-1024x283.png "揭開策略的波動面紗｜MAE&MFE分析圖組使用指南 12")

overlay模式

子圖4-1，將各種數據用[提琴圖](https://plotly.com/python/violin/)呈現統計結果，可藉由`display_mae_mfe_analysis` 中的 violinmode 參數控制顯示模式，預設為group模式，將勝敗手分群統計，overlay模式為全數統計。提琴圖hover過後能顯示數據的**分位數**資料，可快速觀察所有數據的統計分佈，方便設定停損停利點能參考分位數的數值。  
除了先前介紹的mae\_mfe，其他還有統計數值:

*   pdays\_ratio:獲利交易日數/交易持有日數，中位數數值若大於0.5，代表多數交易持有期間都是獲利，操作起來更有彈性。若mfe高，但pdays\_ratio低，代表若沒把握到衝高的少數時期，則會錯過理想報酬。

### 結論
--

是不是對波動分析更加瞭解了呢？一張圖表包山包海，完整分析出策略細節。

若想更深入了解MAE/MFE最大幅度分析法。除了國外資源，中文內容推薦[藍月記事](https://www.maemfe.org/search/label/%E4%BA%A4%E6%98%93-MAE%2FMFE%E6%9C%80%E5%A4%A7%E5%B9%85%E5%BA%A6%E5%88%86%E6%9E%90%5B%E5%BD%B1%E7%89%87%5D)，其對這方面的策略體質觀察、優化有全方位的影片教學內容，作者對量化分析與交易心理有獨道見解，推薦大家前往學習。

==========================================================

### 簡介
==

在股市投資，大部分人都希望達到最大收益，但風險也伴隨著高回報。你可曾想過，有一個投資策略可以90%的機率比固定配置報酬更好嗎？更重要的是，這個策略直接應用了兩位諾貝爾經濟學獎得主的研究結果！在本篇文章中，我們將深入了解「生命週期投資法」，並且引用生動的薪水例子，讓大家更加易懂地掌握兩位諾貝爾獎得主的理論。

Paul Samuelson的生命周期假說（Life Cycle Hypothesis）告訴我們，人們會根據他們一生中的預期收入和消費需求做出消費和儲蓄決策。換言之，在工作期間，你會積累資金以應對退休後的生活支出；而退休後，你則會動用累積的儲蓄來資助你的消費。

Robert Merton的跨期資本資產定價模型（Intertemporal Capital Asset Pricing Model）則讓我們明白，在建立投資組合時，不僅要考慮資產的預期收益和風險，還要考慮這些資產與未來收入的相關性。例如，當你在工作時期，未來穩定的薪水可以被視為一種隱含的低風險資產，因此你的投資組合應該考慮到這一點。

現在，讓我們介紹本文主角：[《諾貝爾經濟學獎得主的獲利公式：3階段分配法》](https://www.books.com.tw/products/0010876097)。此書主張使用分散時間法來投資，擴展投資週期到幾十年，並運用“時間多樣化”的優點，實現時間上的風險分散。透過此策略，投資人可以在不同的市場環境中尋求更高的報酬同時降低風險。

### 什麼是**3階段分配法?**
==============

3階段分配法夠幫助投資者根據自己的風險特質、未來現金流及投資期間制定合適的投資策略。現在，我們將一步步地介紹此方法，並且以生動的例子更好地說明其應用。

### 設定投資股市的總金額
----------

在進行三階段投資法之前，投資者需要首先根據個人的風險承受能力確定自己在投資組合中股票與其他資產的比例。接下來，投資者需要計算未來的現金流（即薪水）並將其折現，以估算在未來投資股市的總金額。此步驟非常重要，因為它能幫助我們更好地規劃資產配置策略。

例如，小明根據自己的風險偏好，確定了股市占比目標。接著，他需要估算未來的薪水並將其折現。他可以透過預測未來的薪水增長與折現率來實現。通過這一步驟，小明可以確定他未來將投資股市的總金額，並且更好地規劃投資策略，確保在整個生命週期中，他的資產配置能夠達到理想的平衡。

### 實施三階段投資法
--------

投資對於每個人而言都是一個非常重要的議題，尤其是當你打算跨足股市的時候，即使是有經驗的投資者也可能會感到困惑和不確定。這就是為什麼生命週期投資法是一種非常流行的投資策略之一，通過分段進行投資，以確保投資者可以獲得最大化的收益，而不會承擔過高的風險。以下就是詳細的三階段投資法：

1.  第一階段：通常指在你剛開始工作的前十年，這個時期你應該按照2:1的槓桿進行投資，這意味著你會將兩倍的資金進行投資，以追求更高的收益。在這個階段，你需要盡可能地增加你的資產，以便在未來的幾年中有足夠的財富以達到你的資產目標。
2.  第二階段：通常指在你工作後的十年到大約50歲之間的時間，這個階段你需要逐漸降低槓桿比例，使其大於1:1，但小於2:1。將這樣的過程計入你的投資計畫開始更重視你的投資風險，同時也要注意你的資產分散度是否足夠。這也是非常重要的一點，因為資產分散度過低往往會導致風險過高。因此，在這個階段，你需要逐漸降低你的槓桿水平，以降低你的風險水平。
3.  第三階段：通常指退休前的十年時間，這個階段你的投資組合應該完全去槓桿化，並包括公司和政府債券以及股票。進一步的，你應該保持良好的投資規劃，定期調整你的投資組合，以確保你的風險水平越低越好。

可以參考以下圖表中的深色線條，以便於更透徹的理解生命週期投資策略各個階段的變化。

![生命週期投資](https://www.finlab.tw/wp-content/uploads/2023/03/image-15-1024x633.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 1")

讓我們來看一個簡單的例子吧。假設有個名叫小明的人，他今年25歲，每年的薪水是60萬，計劃一直工作到65歲退休。在他人生的40年中，總收入為2400萬。假設他每年預計能夠存下20%的薪水，而且他的投資組合將按照股債比例60/40來分配，因此他預計會在一生中投入480萬到股市中。

使用三階段投資法，小明的投資策略如下：

1.  第一階段：在股市總資產達到480萬前，保持兩倍槓桿進行投資。
2.  第二階段：在股市總資產達到480萬後，保持股市部位不變，隨著本金增加逐漸降低槓桿，直到完全沒有槓桿為止。
3.  第三階段：在沒有槓桿的情況下，開始購買債券，直到達到股債配置比例60/40。

### 現實例子: 住房貸款
----------

現在，讓我們看一個更貼近生活的例子——房屋貸款。當你買房子時，通常只需支付一小部分頭期款，然後通過貸款支付剩餘房價。這種情況下，你實際上使用了槓桿，通常是兩倍到四倍的金額，通過支付利息來購買房子。這也意味著你在負債的情況下進行了投資。這就是為什麼很多人在年老時發現，房子成為了他們最大的資產。這正好說明了生命週期投資法在現實生活中的應用。

回到小明的例子，他在三個階段中採取了不同的投資策略，以最大化他的投資回報。這種方法讓他在年輕時利用槓桿追求更高的收益，隨著年齡增長逐步降低風險，最後在退休前確保他的資產配置達到理想的股債比例。這樣的策略不僅提高了他的投資收益，還確保了資金的安全。

總之，生命週期投資法通過三個階段的投資策略，幫助投資者更好地平衡風險與收益。透過運用這種方法，投資者可以充分利用槓桿、分散風險並確保資產配置適應自己的需求和目標。無論你是剛開始投資還是已經積累了一定資產，都可以從生命週期投資法中受益。

### **書中回測分析**
==========

### **投資策略大比拼：生命週期投資法的卓越表現**
------------------------

在眾多投資方法中，生命週期投資法因其簡單易行、風險控制和回報表現出色，被眾多投資者所推崇。除了生命週期投資法外，還有固定比例投資策略和目標日期投資策略等方法，今天我們將深入探討這些策略方法，看看它們的優缺點和表現如何。

1.  固定比例投資策略：顧名思義，就是在整個投資期間保持固定的股票和債券比例。例如，一個投資者可能選擇在整個投資期間保持股票佔比為60%，債券佔比為40%。這種策略的好處在於簡單易行，易於操作，且適用範圍廣泛。但缺點也很明顯，它可能無法完全考慮到投資者的風險承受能力和未來收入變化，尤其是在市場變動劇烈的情況下，風險管理方面的表現可能不佳。
2.  目標日期投資策略：目標日期投資策略是根據投資者距離退休的時間，逐漸降低股票配置的比例。一般而言，當投資者接近退休時，股票佔比將逐漸下降，以降低投資風險。例如，當一個投資者退休時間為30年後，他可能會在股票和債券之間採取50/50的比例，但當退休時間剩餘10年時，他可能會把股票配置比例調整為20%。這種策略在目標日期基金中非常常見，適合那些希望自動調整資產配置的投資者，但同樣也存在管理費用高、基金選擇有限等問題。

### **回測方法與結果分析**
-------------

書中有關生命週期投資策略的回測結果，讓人驚嘆其卓越的表現。該策略不僅在最低、平均、最高報酬上表現出色，還在10%、25%、75%和90%的百分位數上都表現優異，這意味著在不同市場環境下，它都能表現出色。但這個策略到底是真的那麼神奇呢？下面我們將進一步探討其真實性，親自動手進行回測，並分析回測結果。

在書中的回測過程中，選擇使用不同出生年份的投資者，以反映不同的市場環境。這些投資者都經歷了各自46年的投資生涯，並在回測時間範圍為1871年至1914年期間內參與股市。每位投資者的工作年限為44年，例如，第一位投資者的回測周期為1871年至1914年，第二位投資者的回測周期則是1872年至1915年，以此類推。

![image 16](https://www.finlab.tw/wp-content/uploads/2023/03/image-16-1024x645.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 2")

如上圖所示，無論在最低、平均或最高的結果上，以及10%、25%、75%、90%的百分位數，生命週期投資策略的表現都優於其他兩種投資策略。特別是在最低報酬方面，生命週期投資策略的表現比其他兩種投資策略更加穩健，更具保值性。這些結果證明了生命週期投資法確實可以幫助投資者在不同市場環境下實現穩健的收益。

但值得注意的是，回測結果僅代表過去的表現，並不能保證未來績效。另外，投資者在使用生命週期投資策略時，還需要根據自己的投資目標、風險承受能力和收入變化等因素進行調整。因此，投資者需要對自己的情況進行全面評估，並謹慎使用投資策略。

### 程式回測實戰：探索策略效果
=============

接下來我們將進一步探討其真實性，親自動手進行回測，並分析回測結果。相關的程式碼會放在[Colab](https://drive.google.com/file/d/1xQcmWXfwqJWjOP9f24yxMVpxWqBCQ_Vz/view?usp=sharing)上供大家使用，若有任何疑問，歡迎在[Discord Server](https://discord.com/invite/tAr4ysPqvR)提問。

### Lifecycle Investing **模擬器**
---------------------------

首先我們建立了Lifecycle Investing模擬器，能夠幫助使用者了解槓桿在不同市場表現下的變化，並且顯示相應的投資組合價值。每次執行模擬器，都會隨機生成三種股債走勢及相應的生命週期投資槓桿比例變化，並且透過多次嘗試，讓讀者對生命週期投資有更深入的理解，並認識到市場表現對槓桿幅度和持續時間的重要影響。

例如，在第一次模擬中，由於市場前期表現不佳，投資者難以達到設定的股票投資總金額，直到退休前夕才成功去槓桿。而在第二次模擬中，市場前期表現出色，投資者在經歷20年後降低槓桿，並加入債券，提前實現理想的股債配置。

![image 20](https://www.finlab.tw/wp-content/uploads/2023/03/image-20-1024x975.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 3")

模擬器的多次嘗試能讓讀者對生命週期投資有更深入的理解，並認識到市場表現對槓桿幅度和持續時間的重要影響。

### **評估未來資產的折現價值：建立個人財富藍圖**
------------------------

我們將探討如何評估未來資產的折現價值，並將其應用於不同的投資策略。首先，讓我們從確定如何計算終身財富的折現價值開始。在這個過程中，我們需要考慮許多因素，例如當前年齡、退休年齡、年薪以及儲蓄比例等等，因為這些因素都會因使用者而有所不同。

為了讓這個過程更加貼近一般人的未來薪資狀況，我們從中華民國統計資訊網爬取了CPI年增率資料作為通膨數據，並使用行政院主計處薪資平台收錄的101-110年薪資平均以及年齡不同（職位升等）帶來的薪資成長幅度。這些數據幫助我們更好地了解未來通膨率、經濟環境對薪資的影響，以及不同年齡（與職位晉升）帶來的薪資增長幅度。當然，實際情況仍會因個人因素而有所不同。

![image 17](https://www.finlab.tw/wp-content/uploads/2023/03/image-17-1024x870.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 4")

在計算出未來薪資狀況後，我們將所有年份的儲蓄相加，乘以在股市投資的比例，來得到最終的股市總部位。

![image 18](https://www.finlab.tw/wp-content/uploads/2023/03/image-18-1024x551.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 5")

### **探索100種潛在的股票/債券市場走勢：評估不同投資策略的表現**
----------------------------------

想要做好投資，必須先瞭解市場走勢。而為了讓讀者更清楚了解三種不同的投資策略，我們使用蒙地卡羅模擬(Monte Carlo)，計算100種可能的未來市場走勢，並且評估不同投資策略在這些市場環境下的表現。

在這個模擬中，我們使用過去的TLT和SPY歷史數據，計算出市場波動性和回報率，並從中模擬出100種可能的市場走勢。透過這些數據，我們可以對三種不同投資策略的表現做更進一步的分析，並且提供更多決策上的參考。

以下是這100種可能市場走勢的分布圖：

![image 19](https://www.finlab.tw/wp-content/uploads/2023/03/image-19-1024x452.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 6")

### **進行三種投資策略的回測分析**
-----------------

經過一百次模擬，我們比較了三種不同的投資方案在不同市場環境下的表現。其中，生命投資的總報酬率在25、50、75百分位數和最大值的表現都遠超過了其他兩種方案，實踐槓桿投資的確能夠有效提高收益率！

![image 21](https://www.finlab.tw/wp-content/uploads/2023/03/image-21-1024x527.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 7")

下面我們來看一下三種方案的最大回撤（Maximum Drawdown，MDD）表現。因為生命投資在前期運用了槓桿等方式進行投資，所以其MDD相較於其他兩種方案要高出不少，並沒有很好地規避風險。但是，通過對損失數字的深入分析，我們發現這種差距其實並不明顯。原因是，在前期使用槓桿時，投資總金額相對地並不會造成太大的虧損。因此，如果以長期投資的角度來看，這樣高的MDD其實沒有我們想象中的那麼可怕。

綜合以上分析，我們可以得出這樣一個結論：雖然一開始使用槓桿可能會帶來更多風險，但在長期投資目標的規劃下，這樣的投資方式卻能為您創造更高的利益。當然，投資風險隨時存在，選擇適合自己的投資方案才是最重要的。

![image 22](https://www.finlab.tw/wp-content/uploads/2023/03/image-22-1024x267.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 8")

此外，我們還對各投資策略進行了更多分析，包括：

*   total_return：總回報率
*   cagr：年化複合回報率
*   max_drawdown：最大回撤
*   max_drawdown_amount：最大回撤金額
*   daily_sharpe：日夏普比率
*   daily_vol：日波動率
*   best_day：最佳單日回報
*   worst_day：最差單日回報
*   best_year：最佳年度回報
*   worst_year：最差年度回報

這些分析結果都放在以下圖表中供大家仔細研究參考，以便在選擇投資策略時能夠充分了解各種策略在不同市場環境下的表現。

![image 23](https://www.finlab.tw/wp-content/uploads/2023/03/image-23-759x1024.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 9")

### **用 10、50、90 百分位數比較策略績效表現**
---------------------------

透過對一百次模擬的分析，我們可以比較三種投資策略在10、50和90百分位數上的表現，以瞭解它們在不同情況下的優劣。值得一提的是，生命週期投資策略在所有百分位數上都呈現出色的表現，尤其是在退休時，其總報酬遠高於另外兩種策略。即使在最不利的情況下，生命週期投資策略仍能小幅戰勝其他兩種策略。換句話說，生命週期投資策略贏過另外兩種策略的機會至少超過90%。

![image 24](https://www.finlab.tw/wp-content/uploads/2023/03/image-24-1024x320.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 10")

### **最壞情況下的績效分析**
--------------

接下來，我們來分析三種策略在最差情況下的表現。在100次模擬中，固定策略和目標日期策略的最差表現指數分別為第83次模擬，而生命週期策略的最差表現指數則為第62次模擬。

具體地研究當固定策略和目標日期策略表現最差時，生命週期策略的表現情況，以及當生命週期策略表現最差時，固定策略和目標日期策略的表現情況，以凸顯策略之間的績效差距。

### 當固定比例策略和目標日期策略表現最糟的第83次模擬

當市場前期大漲、中期下跌、後期盤整，而債券市場長期盤整時，對於固定持有債券的固定比例投資策略和逐漸增持債券的目標日期策略來說，這是非常不利的。但在這樣的情況下，生命週期投資策略卻在股票市場前期勇敢地採用槓桿投資，成功獲得大量利潤。即使後期債券市場表現不佳，生命週期投資策略仍然遙遙領先另外兩種策略，成為最佳的投資策略。

以下是固定比例策略和目標日期策略表現在最糟狀況下的表現圖：

![image 25](https://www.finlab.tw/wp-content/uploads/2023/03/image-25-1024x526.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 11")

### 當生命投資策略表現最糟的第62次模擬

生命週期投資策略在市場前期和中期漲幅不高，後期債券市場下跌時表現最糟。然而，即使在這樣的最壞情況下，生命週期投資策略的績效與固定比例策略和目標日期策略相比沒有太大差距。這意味著生命週期投資策略在最壞的情況下仍具有相對穩定的績效。

以下是生命週期投資策略在最糟狀況下的表現圖：

![image 26](https://www.finlab.tw/wp-content/uploads/2023/03/image-26-1024x526.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 12")

總結而言，在固定比例策略和目標日期策略表現最糟狀況下，生命週期投資策略表現極佳。相反地，在生命週期投資策略最糟狀況下，其績效與另外兩種策略相差無幾。這說明了生命週期投資策略具有較高的上限和較低的下限，並且是一種相對穩健的投資策略。

### **應對連續大漲/大跌市場的策略探討**
--------------------

近期市場波動劇烈，對於投資者而言，應對連續大漲大跌的情況是一個必須面對的問題。在此，我們來探討一種應對方法：生命週期投資法。相信透過以下的介紹，您會對此策略有更深入的了解，也能在未來的投資中更理性地應對市場波動。

在一般的投資策略中，當股價下跌時，投資者的資產往往也會相對下跌。但是生命週期投資策略中，每10%的再平衡機制確保了投資組合在下跌時不會按照兩倍的比例下跌。例如，當股價從100跌至47.8時，生命週期投資策略的價值仍有26.2。這機制就像是變相的止損，在極端行情下降低畢業離場的風險。

![image 27](https://www.finlab.tw/wp-content/uploads/2023/03/image-27-1024x389.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 13")

此外，在極端樂觀的市場環境下，兩倍槓桿所獲得的回報遠高於直覺所預期。例如，在連續10日漲停的情況下，股價從100上升至259.4，而兩倍槓桿的價值達到了619.2，增幅達到121%。生命週期投資法的兩倍槓桿策略能在極端情況下提高投資回報，也是其一個優勢所在。

![image 28](https://www.finlab.tw/wp-content/uploads/2023/03/image-28-1024x389.png "生命週期投資法則：眾多諾貝爾經濟學獎得主同聲讚譽的長期投資方法！ 14")

### **生命週期投資法的優勢**
==============

綜合以上分析，我們可以得出以下幾點生命週期投資法的優勢：

1.  多數情況下，生命週期投資的績效優於固定配置和目標日期策略。
2.  即使在最糟狀況下，生命週期投資法的績效也與其他策略相差無幾，顯示其具有相對穩定的績效。
3.  生命週期投資法的每10%再平衡機制可以在極端行情下降低風險，保護投資者免受巨大損失。
4.  兩倍槓桿在極端樂觀行情下能帶來顯著的超額回報。

因此，生命週期投資法在整體風險收益比上具有優勢，特別適合長期投資者。相對於其他投資策略，在多數情況下，生命週期投資法的績效更優秀。此外，即使在市場極端狀況下，生命週期投資法的績效也與其他策略相差無幾，表現出相對穩定的投資特性。這樣的優勢可讓投資者在長期投資過程中更加穩健。

當然，投資者在實際操作時還需考慮自身風險承受能力和投資目標來調整槓桿比例和資產配置。透過多次嘗試模擬器可以幫助投資者更好地了解生命週期投資法的運作原理及其在不同市場情況下的表現。希望透過以上的探討，您能更全面地了解生命週期投資法的優勢，並且能在未來的投資中更加理性地應對市場波動。

### **注意事項 & 警語**
-------------

想要在投資市場上掌握更大的機會，槓桿投資是一個值得一試的投資方式。在開始使用槓桿投資之前，投資者應了解這種工具的風險和應對方法，才能更好地掌握投資方向。

### **如何開槓桿？**

要開始使用槓桿投資，投資者可以選擇期貨、長期內價選擇權或槓桿ETF等槓桿工具。但是，在選擇槓桿工具時，應考慮斷頭風險、利率成本和重新調整比例難易度等因素。槓桿投資需要投資者付出更高的風險和成本，所以投資者應該仔細評估自己的風險承受能力和經驗，選擇適合自己的投資方式。

而在使用槓桿投資時，投資者應特別注意利息和斷頭風險等因素。如果不慎操作，可能會導致投資者失去全部本金。因此，投資者在使用槓桿投資前應詳細研究和了解各種風險因素，並在根據自身的投資經驗和風險承受能力進行衡量後再進行投資。

### **缺點**

生命週期投資法也有一些潛在缺點，如下所示：

*   緊急資金：遇到現實生活中的風險時，可能無法立即提取資金。
*   自我投資：年輕時可能需要更多資金投資自己，例如教育、創業等。
*   心理承受能力：投資者是否能承受槓桿投資帶來的波動，並對指數投資策略保持信心。

### **不適合的投資者**

以下類型的投資者可能不適合使用生命週期投資法：

*   投資金額過小：對於資金有限的投資者，槓桿投資風險較高。
*   欠卡債：償還高利率債務應優先於投資。
*   無緊急預備金或預先支出的費用：如未儲存足夠的緊急資金或預先支付孩子學費等費用。
*   薪水與市場行情直接掛鉤：如果收入與市場波動密切相關，則使用槓桿投資可能增加風險。
*   賠錢後寢食難安：無法承受投資虧損壓力的投資者不適合槓桿投資。

在考慮使用生命週期投資法時，投資者應充分了解自身的風險承受能力和投資目標，並在審慎評估各種風險因素後作出決策。這種投資策略可能不適合所有人，但對於那些有長期投資視角和足夠的資金支持的投資者來說，它可能是一個有效的資產配置工具。在實施生命週期投資法之前，請務必做好充分的研究和規劃，確保該策略符合您的需求和期望。

### 總結
==

生命週期投資法是一個非常有趣的投資策略，透過將風險從生命後期移至前期，讓投資者可以更有效地管理風險和獲得報酬。這種投資策略並非是為了降低波動度，而是因為年輕時有現金流，通常對於風險有更大的容忍程度。此外，前期對於股票的槓桿，越早曝險於股市，獲得風險溢酬的機率較大。這意味著在某短時間周期內一次性投入，不一定能享受到長期平均的風險溢酬。

然而，我們必須指出，本次回測並沒有考慮到再平衡的手續費、槓桿的借貸成本、心理壓力等因素。槓桿會放大許多風險，因此我們並不推薦此投資方法。在實際應用生命週期投資法時，讀者需要自行判斷並謹慎思考。為了確保透明度，我們提供了所有回測代碼供讀者自行檢查。

這種投資策略的潛在效益是，讓投資者能夠更好地管理風險和獲得報酬。透過將風險從生命後期移至前期，投資者可以在年輕時承擔更多的風險，並且在投資組合的整個生命週期內享受到更高的報酬。此外，生命週期投資法還可以幫助投資者在不同的生命週期階段中調整投資策略，以滿足其不同的需求和風險承受能力。

最後，我們要提醒讀者，在實施生命週期投資法之前，務必要做好充分的研究和規劃，確保該策略符合您的需求和期望。只有在充分了解潛在風險和報酬之後，您才能做出明智的投資決策。因此，在使用生命週期投資法之前，建議讀者掌握基本的投資知識和技能，包括風險管理、投資組合配置、選擇投資工具等方面的知識，以便更好地應對市場的變化和風險。

### 相關資源連結
======

除此之外，我們還提供了此篇文章的對應[Colab連結](https://drive.google.com/file/d/1xQcmWXfwqJWjOP9f24yxMVpxWqBCQ_Vz/view?usp=sharing)和相關資源連結，以便讀者能夠更深入地了解生命週期投資法。同時，我們也歡迎讀者到我們的[Blog](https://www.finlab.tw/)逛逛，以獲取更多關於投資的知識和技能。


========================================================================================================
## 資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開)

### 為什麼要做資產配置?
----------

### 許多觀眾詢問的問題

許多觀眾詢問，他們遇到以下問題，希望能獲得我們的建議：

1.  雖然有買不同的標的、甚至還買了美股，但大盤不好的時候還是全部一起下跌。當崩盤時，對於平時沒有太多時間鑽研股票的觀眾來說，雖然心裡明白下跌是暫時的，但還是會忍不住慌張，導致無法全心投入在本業上，也很難繼續紀律執行自己的買賣策略，甚至會恐慌性的全部賣出。想請問有沒有辦法，能夠降低這個最大回檔的幅度，到一個自己能接受的範圍、卻還是能獲得報酬率?
2.  手上同時看好幾支股票想要長期持有、或是想要同時運行好幾支選股策略，但往往不知道該在哪支股票/策略上分配更多的資金，最後往往採用平均分配的方式，但總覺得有更好的、客觀的方式來決定這個資金比重。

### 介紹什麼是資產配置、怎麼靠資產配置解決上述問題

*   同漲同跌是因為股票之間存在”相關性”，完全一樣的話相關性就是1、完全相反相關性則為-1。正是因為資產間的相關性有高低正負之分，所以我們可以利用資產配置的技巧，讓不同的資產彼此間的波動被抵銷掉一部分，達到降低波動率、減少下跌幅度的效果。
    *   舉一個極端的例子，假設兩支股票年報酬都是20%、但高度負相關，採取50/50的配置後，以圖說明平均報酬率不變，但是波動下降非常多。
*   資產配置就是將上述例子做更嚴謹的假設、推導，透過計算資產間的相關性、並透過一定的公式去分配各種資產的資金，藉由犧牲少部分的報酬來降低不確定性風險(波動度、最大下跌幅度)。這支影片會先帶大家認識最具開創性、獲得諾貝爾獎的資產配置方法 – 效率前緣，並實作進一步改進的現代資產配置模型 – **Hierarchical Clustering Models。**
    *   若想更深入瞭解資產配置，可以閱讀市場先生的[這篇文章](https://rich01.com/how-asset-allocation-1/)

**分析即將使用的FinLab策略**
-------------------

### 將選股策略視為資產

*   每個資產有自己的預期報酬率、波動度，資產與資產之間可以計算相關性；同樣地每個選股策略也有各自的預期報酬率、波動度，選股策略間一樣可以計算相關性。因此我們可以將不同的選股策略視為不同的資產，透過資產配置分配要給每個策略的資金比重。

### 介紹FinLab的策略

*   使用了13個FinLab策略當作是不同的資產，大家可以到官網的[策略頁面](https://ai.finlab.tw/strategies?tab=FinLab%E7%AD%96%E7%95%A5)查看每支策略背後的開發邏輯是什麼。
*   可以發現不同的策略都是在不同的邏輯下設計的，有的看月營收、有的追突破、看現金流、看負債、看本益比等等。因此呈現出來的策略特性也不盡相同。

### 分析FinLab策略

#### 針對波動度&報酬作圖

![資產配置](https://www.finlab.tw/wp-content/uploads/2023/03/1.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 1")

x軸是波動度、y軸是平均報酬，紅線則是回歸直線，代表大部分的策略都分布在這條線附近。

紅線可以觀察到: 隨著風險的上升，報酬也會逐漸升高。

每一單位風險(波動度)，所能得到的報酬就是夏普比例(sharpe ratio)。夏普比例較高，也就是報酬跟風險的交換比較有CP值(每一單位風險，能換到更多報酬)，圖中點的顏色就代表夏普比率。

有了這張圖之後，就可以根據夏普比例，跟自己的風險偏好(波動度)去選擇適合自己的策略。譬如喜歡低風險的，就挑左下角的，喜歡刺激、發大財的，就可以往右上角去做選擇。

#### 針對MDD&報酬作圖

![2 1](https://www.finlab.tw/wp-content/uploads/2023/03/2-1.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 2")

#### 相關性分析

![3](https://www.finlab.tw/wp-content/uploads/2023/03/3.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 3")

*   針對策略相關性作圖
    *   前面是對每一支策略作單獨的分析，現在我們來分析策略之間的相關性。
    *   策略背後的選股邏輯不同，相關性就低。我們可以藉由這張圖片去選擇彼此相關性比較低的策略同時持有，來減少同漲同跌的狀況發生。
        *   舉藏獒跟藏獒外掛大盤指針為例子，因為藏獒外掛大盤指針是藏獒修改而成，因此兩者的相關性很高(可以對比藏獒與其它策略的低相關性)，如果只持有兩支策略，最好就不要同時挑這兩支策略。

![4](https://www.finlab.tw/wp-content/uploads/2023/03/4-1024x724.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 4")

介紹效率前緣(Efficient Frontier)
--------------------------

### 簡介

*   前面都是透過視覺化的觀察，然後進行人為分析，有沒有更嚴謹、更科學的方式呢?
*   介紹資產配置的先驅、獲得過諾貝爾獎的效率前緣。假設今天隨機給予資產們不同的資金權重，來組成成千上萬種不同的策略(就是下圖中的每一個點)，我們會發現這些隨機的策略被一條隱形的曲線所限制住。這條藍色的曲線就是效率前緣，透過這條曲線我們就可以
    1.  在給定的風險(給定x值)，求出藍色線上對應的y座標(預期能獲得的最好報酬)，並按照那個點的資產配置權重進行投資。
    2.  我們可以找出最佳收益和風險比的投資組合，也就是圖中的星星，有最高的Sharpe Ratio，也就是先前所說CP值最高的投資組合。

![5](https://www.finlab.tw/wp-content/uploads/2023/03/5-1024x576.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 5")

### 實作

*   用FinLab Strategy所畫出來的效率前緣

![6](https://www.finlab.tw/wp-content/uploads/2023/03/6.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 6")

*   理想最佳權重(highest sharpe ratio)，也就是上圖中的星星處，但一樣要記得這是根據過去所算出來的效率最優配置，不代表未來這個配置仍然會是最優的。

![7](https://www.finlab.tw/wp-content/uploads/2023/03/7-1024x571.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 7")

*   隨著給定的風險水準上升，資產配置權重的變化。當給定的風險越來越高時，資產的多樣性就迅速減少，越來越朝向持股單一化(all in)前進，失去了分散投資、降低風險的本意。

![8](https://www.finlab.tw/wp-content/uploads/2023/03/8.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 8")

### 缺點

*   效率前緣聽起來雖然很夢幻，在當時被譽為「華爾街的第一次革命」、「投資界的大爆炸理論」，但實際上拿來使用會發現有許多待解決的問題。
    1.  效率前緣是基于歷史至今為止的資料(歷史報酬率、波動度)所畫出來的，但過去這樣投資好，無法保證未來會一樣好。市場通常是漲跌互見的，因此按照過去歷史所畫出來的效率前緣去做配置，很可能與未來的實際情況有所不同。
    2.  效率前緣的算法可能過度集中在過去報酬率最好的資產上，可以看到將投資組合移到效率前緣上時，資產的多樣性大幅度減少，這反而失去分散投資的本意。
    3.  很容易過擬合(overfitting)：效率前緣透過每一種資產跟其他所有的資產去計算相關性，因此對參數非常敏感。只要上周跟這周的資產價格有些為的改變，藉由效率前緣計算出來的投資組合就可能會大幅度變化，這在實際運用上也非常難以執行。

**介紹 Hierarchical Clustering Models**
-------------------------------------

### Hierarchical Cluster的精神

*   在眾多資產中，有些資產會比較相關。以股票舉例，就可能會分為不同地區的股票如台股、美股，往下又可以區分出不同的類股，如金融股、科技股、生技股等等。資產也是如此。因此我們可以透過多次的分類，先將資產劃分為大大小小的類別。

### 優點

*   透過 Hierarchical Cluster 的分群方法，有以下優點：
    1.  降低複雜度(不用再計算每個資產跟所有資產的相關性了，只要計算自己類別理的就好)，提升模型穩定度。
    2.  加上分類後，可以根據不同種類、層級去進行風險的平衡。譬如可以確保同層級間的所承受的風險是相同的，也就是美股跟台股承受同樣的風險，在台股之中金融股、科技股、生技股又都承受一樣的風險……以此類推，藉由這種方式也可以達成更穩定的風險平衡。

### 實作

*   FinLab策略的Hierarchical Cluster的結果
*   不同的相關性計算方法，有可能會產生不同的分類結果，再這邊我們使用pearson算法做示範
    *   不了解也不用緊張，我們後面會教大家怎麼在不懂各種算法情況下，一樣能分辨出算法的好壞。
    *   下圖我們可以觀察到幾點：
        *   藏獒跟藏獒外掛大盤指針的確非常像
        *   合約負債工、股價淨值比外掛大盤指針的選股邏輯類似，一個挑選營建股在營收尚未認列時的低基期作買入、另一個則是股價淨值低的時候若買入，都是挑好股票在便宜的時候去做買入，因此也被分在同一類。

![10](https://www.finlab.tw/wp-content/uploads/2023/03/10-1024x820.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 9")

### 參數總覽

*   完整的**Hierarchical Clustering Models包含各式各樣的參數，像是如何分類的演算法、分類時所採用的相關性的計算方法、該使用哪種模型來平衡風險等等，共有六個重要的參數(model,covariance,linkage,codependence,rm,obj)，而每一個參數又有多達數十種的演算法選擇。別說是一般投資人，就算是專業的投資人也很少有人能研究完各種參數，更別說參數之間的排列組合了。** 註：對參數**有興趣的可以點擊**[連結](https://riskfolio-lib.readthedocs.io/en/latest/hcportfolio.html#HCPortfolio.HCPortfolio.optimization)查看更細節的資訊。
*   但別擔心，接下來就會教大家用有效率的方法，在不用瞭解各種參數的情況下，找出適合的參數組合

**Random Search & Grid Search**
-------------------------------

### 直覺想法 測了好用就用 窮舉所有

*   最直覺的想法，就是窮舉所有的參數組合一個一個測，並找出所有組合中最好的一個。我們稱這種方法為 Grid Search 網格搜索

![11](https://www.finlab.tw/wp-content/uploads/2023/03/11.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 10")

*   缺點：當參數較多時，排列組合的數量會非常大，導致搜索的時間變長花費資源也變大，在比較複雜的實務中很難達成。
*   以此次實驗為例，6個參數就共有4 x 12 x 14 x 4 x 28 x 8 = 602112種組合要測試，用家裡的電腦可能要跑一年才測的完。

### 參數太多冊不完怎麼辦？RandomSearch

*   因此我們使用Random Search來解決這個問題，從每一個參數中隨機選出一個參數，最終形成一個參數組合。反覆這個隨機選取的動作，也可以找到非常不錯的參數組合。
*   Random Search 的優點
    1.  可以根據自己能接受的時間長短，來決定隨機形成參數組合的次數。
    2.  相對Grid Search來說，Random Search在同樣次數的參數組合測試下，更有效率，這是因為參數間的重要性往往有高有低。 以下圖為例，x軸是相對重要的參數、y軸則是不太重要的參數，也就是說參數組合的好壞取決於隨機選取的點的x座標，因此我們希望能選出越多x座標不同的點。 Grid Search(網格搜索)的方式，在取樣9次的情況下，只會有三個不同的x座標，然而Random Search則可以取樣到不同的9個x座標點。

![12 1](https://www.finlab.tw/wp-content/uploads/2023/03/12-1-1024x560.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 11")

(論文出處: [Random Search for Hyper-Parameter Optimization](https://www.jmlr.org/papers/volume13/bergstra12a/bergstra12a.pdf))

### 結果

以下就是我們對這六種參數所形成的參數組合，進行了5000次Random Search的結果，大約耗時5天。我們會把測試過的參數組合以及對應的結果，免費開放給大家下載，以節省大家的測試時間 (可能轉成共享的csv檔案)

*   報酬

![13](https://www.finlab.tw/wp-content/uploads/2023/03/13.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 12")

*   MDD

![14](https://www.finlab.tw/wp-content/uploads/2023/03/14.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 13")

**透過 Random Search 劃出 Efficient Frontier**
------------------------------------------

### 該怎麼從5000種不同的參數組合，找出適合的組合呢?

*   若單純挑選報酬率最高的參數組合使用，有以下缺點:
    1.  這個參數組合雖然報酬率最高，但可能波動很大、下跌風險也很大，並不符合我們的資產分配的本意。
    2.  我們對於參數本身特性完全不瞭解，沒辦法按照自己的偏好(風險偏好、追求高夏普、低回徹等等)，舉一反三去找出其他的優秀的參數組合。
    3.  測試了5000次之後，之前從裡面挑選最好的參數組合來使用，很容易產生overfitting的現象。 Overfiiting：過度學習訓練集中的資料，導致於沒法順利分辨在訓練集外的其他資料。就像是學生靠死背題目答案來作答，而不是真正去理解題目。這樣的學生雖然在有看過的題目一定能拿滿分，但實際上了考場遇到了自己沒看過的題目，就會考的一蹋糊塗。
        *   下圖中，黑線是我們希望學到的、綠線則是overfitting後所學到的結果

![15](https://www.finlab.tw/wp-content/uploads/2023/03/15-1024x1024.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 14")

### **透過 Random Search 劃出 Efficient Frontier**

以x軸為波動度(風險)、y軸為報酬，可以發現一條明顯的效率前緣。

![16](https://www.finlab.tw/wp-content/uploads/2023/03/16.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 15")

進一步，我們可以分別針對個別參數作圖，也就是將在該個參數中，類別一樣的都顯示為同一個顏色。以下圖(參數: model)為例，HRP這個model就會都是呈現出藍色的點，用這個方式我們就可以一目了然的瞭解這些模型參數的特性。

![17](https://www.finlab.tw/wp-content/uploads/2023/03/17.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 16")

### 如何判斷參數好壞 & 特性

*   判斷三要點:
    *   是否貼合(隱形的)效率前緣：越貼近，代表參數越有效率；若大部分都在效率前緣內部，就代表有其他更好的參數選擇。
    *   同參數的點分布是否集中：判斷參數穩定性，分布的點越集中，代表該參數的穩定性越高。
    *   分布位置：說明參數特性，譬如越偏左下角風險報酬都比較低，是比較溫和穩定的策略；在右上角風險和報酬則都較高，是比較激進的策略，這邊的選擇可依據個人偏好，沒有好壞之分。
*   以Model參數示範
    *   HERC & HERC2 這兩個模型在表現上很類似，大部分也都貼齊效率前緣
    *   HRP的表現非常穩定(點幾乎都聚集在一起，不像其他參數般分散)
    *   NCO有最高的Sharpe Ratio資料點，同時可以再大致區分成三個子類別

![18](https://www.finlab.tw/wp-content/uploads/2023/03/18.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 17")

若點都混雜在一起

代表該參數可能不重要，沒有顯著的影響性，可以略過

可能是分的種類太多，可以分成幾張圖來查看

![19](https://i0.wp.com/www.finlab.tw/wp-content/uploads/2023/03/19.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 18")

![20](https://i0.wp.com/www.finlab.tw/wp-content/uploads/2023/03/20.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 19")

### 透過分析，選出穩定的適當參數組合

首先針對Model部分，由於obj(objective function)是NCO Model的子分類，代表NCO這個model其實可以衍伸出四個子model，因此要搭配一起看。可以發現NCO對應的三個子分類，第一個子分類是NCO+ERC，剩餘的兩個子分類則是NCO+Utility/MinRisk。在所有的Model裡，NCO+ERC是最穩定的，並且Sharpe Ratio也十分高，作為我們選擇的參數。

![21](https://i0.wp.com/www.finlab.tw/wp-content/uploads/2023/03/21.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 20")

![22](https://i1.wp.com/www.finlab.tw/wp-content/uploads/2023/03/22.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 21")

linkage選擇ward，因為點大多分布在效率前緣上，代表在各個不同的風險、參數組合下，都有不錯的表現。

![23](https://www.finlab.tw/wp-content/uploads/2023/03/23.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 22")

剩餘的三個參數(covariance codependence rm)相對來說就沒有特別明顯的分布，為了降低參數過擬合的機率，就沒有必要繼續進行參數最佳化，因此剩下三個參數皆使用預設值即可。(以下簡稱此投資組合為Final Portfolio)

![24 1](https://i1.wp.com/www.finlab.tw/wp-content/uploads/2023/03/24-1.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 23")

![25](https://i1.wp.com/www.finlab.tw/wp-content/uploads/2023/03/25.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 24")

![26](https://i0.wp.com/www.finlab.tw/wp-content/uploads/2023/03/26.png?ssl=1 "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 25")

對選定的參數組合進行詳細回測，結果呈現
-------------------

### Cumulative Return Curve

*   績效曲線非常平穩，平均年報酬為40%

![27](https://www.finlab.tw/wp-content/uploads/2023/03/27.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 26")

### Drawdown Curve

*   最大MDD為-13.75%，遠小於一開始的FinLab策略

![28](https://www.finlab.tw/wp-content/uploads/2023/03/28.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 27")

### 月報酬分布圖

![29](https://www.finlab.tw/wp-content/uploads/2023/03/29.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 28")

### 逐月return

*   每年皆為正報酬，即便2022年空頭年也有勉強守住
*   最大單月虧損為-8%

![30](https://www.finlab.tw/wp-content/uploads/2023/03/30-1024x303.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 29")

### 資產配置隨時間作圖

*   可發現投資組合確實會隨著時間變化而動態調整(20天調整一次)，且主要由合約負債建築工、低波動本意成長比、股價淨值比外掛大盤指針這些比較穩健的策略佔投資組合的大部分。

![31](https://www.finlab.tw/wp-content/uploads/2023/03/31-1024x383.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 30")

### 結論

首先受限於策略皆為近幾年開發，沒辦法只拿開發後的時間段來進行資產配置，因此策略本身績效有一部分是來自訓練集的資料，實際上線的績效理論上會稍微下降。

但用肉眼就可以觀察到，整個投資組合的走勢相當平穩，回檔幅度也非常小，常常創新高。

### 完整 Portfolio Stats Summary (素材、有需要可自由取用)

![32](https://www.finlab.tw/wp-content/uploads/2023/03/32.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 31")

與原FinLab策略比較 & 槓桿效果分析
---------------------

### 當日報酬波動程度對比

![33](https://www.finlab.tw/wp-content/uploads/2023/03/33-1024x353.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 32")

*   平均持有所有策略 vs Final Portfolio，可以看出來每日的波動度也稍微贏過平均持有

![34](https://www.finlab.tw/wp-content/uploads/2023/03/34-1024x353.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 33")

### 槓桿的作用

*   我們的資產配置是一個高Sharpe Ratio的投資組合，策略本身比較穩定，因此風險、報酬都比較低。但如果願意承受風險更多的風險，我們可以藉由槓桿來等比例的放大我們的投資組合。
*   在同樣程度的風險(波動率)下，Final Portfolio可以獲得三者之中的最高報酬。同時斜率的傾斜角度其實就是Sharpe Ratio，在我們假設無風險利率為0的時候，夏普比例就等於報酬率/標準差，也就是圖中藍/綠斜線的斜率。從這個角度來理解，就能很明顯的看出Final Portfolio > 平均持有 >> 單一策略。因此即便你是想追求高報酬的投資人，也可以透過好的資產配置方式和適當的槓桿，來讓自己的投資更上一層樓。

![35](https://www.finlab.tw/wp-content/uploads/2023/03/35.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 34")

*   同上，若將風險改成MDD的情況下，Final Portfolio表現一樣為三者最佳，而且差距更加顯著。

![36](https://www.finlab.tw/wp-content/uploads/2023/03/36.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 35")

個人化槓桿試算器
--------

### 該如何得知該開的槓桿比例呢?

如果想要開槓桿的話，要怎麼知道自己適合開多少倍的槓桿呢? 我們提供一個簡單的試算小程式！藉由輸入能接受的最大下跌幅度 / Final Portfolio的預期最大下跌幅度，我們就可以得出理想的槓桿倍數。

舉例：若我認為自己最多可以承受20%的最大下跌幅度，而Final Portfolio的最大下跌幅度為13.75%，兩者相除之後便能得到我的槓桿倍數為145.74%

註：還要考慮到槓桿所需的資金借貸利息、以及未來MDD有超出預期的可能，建議謹慎衡量後將最後得到的槓桿倍數再稍微往下降一些

![37](https://www.finlab.tw/wp-content/uploads/2023/03/37.png "資產配置：獲得年報酬 40% 的穩健投資組合 (腳本公開) 36")

相關資源連結
======

附上此篇文章的對應[Colab連結](https://drive.google.com/file/d/1FMfflOVOzzvcGT3sE7BC8r95WEdshjK4/view)、[YT連結](https://youtu.be/y7Metbd4ylI)，供有需要的同學自行使用。

想吸收更多類似知識，歡迎到我們的[Blog](https://www.finlab.tw/)逛逛!


========================================================================================================




========================================================================================================



